"""
Парсер выдачи AliExpress RU (страница поиска /wholesale).

Перенесён из корневого main.py практически без изменений; убран CLI-блок
(__main__) и добавлен хелпер scrape(), которым пользуется FastAPI-эндпоинт.

Состоит из двух частей:
  1. parse_products(html) — разбирает уже полученный HTML в список товаров.
     Работает офлайн, зависит только от bs4.
  2. fetch_html(url) / fetch_all_pages(url) — загружают страницы через
     Playwright (headless-браузер), потому что выдача рендерится JS и закрыта
     антибот-защитой; обычный requests.get() вернёт страницу без товаров.

Извлекаемые поля: url, product_id, sku_id, title, price, old_price,
discount, currency, rating, orders (сколько купили), delivery, images.
"""

import asyncio
import re
import sys
import threading
from dataclasses import dataclass, asdict, field
from typing import Optional
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

from bs4 import BeautifulSoup

# Ссылки пагинации ведут на /wholesale?...&page=N — номер вытаскиваем отсюда,
# а не из хэшированных классов RedSeoPagination__...
PAGE_HREF_RE = re.compile(r"[?&]page=(\d+)")

# Карточку товара опознаём по ссылке на /item/{id}.html — это стабильно,
# т.к. на неё завязан переход на товар. Хэшированные CSS-классы
# (вида ...__6ykaq) НЕ используем: они меняются при каждой сборке фронта.
ITEM_HREF_RE = re.compile(r"/item/(\d+)\.html")
# Картинки товаров лежат на CDN aliexpress-media — опознаём по домену,
# а не по классу галереи.
IMAGE_HOST = "aliexpress-media.com"
# Превью-суффикс вида .jpg_480x480.jpg — режем, чтобы получить оригинал.
IMAGE_THUMB_RE = re.compile(r"\.(jpg|png|webp)_\d+x\d+\.(jpg|png|webp)$", re.IGNORECASE)

# 1 234 ₽ / 79 ₽ — цифры с обычными и неразрывными пробелами, затем валюта
PRICE_RE = re.compile(r"([\d\s\u00a0]+)\s*([₽$€]|руб)", re.IGNORECASE)
# -31%
DISCOUNT_RE = re.compile(r"-?\d+\s*%")
# 4.5  (рейтинг)
RATING_RE = re.compile(r"^\d[.,]\d$")
# "64 купили" / "4 303 купили"
ORDERS_RE = re.compile(r"([\d\s\u00a0]+)\s*купил", re.IGNORECASE)


@dataclass
class Product:
    url: Optional[str] = None
    product_id: Optional[str] = None
    sku_id: Optional[str] = None
    title: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    discount: Optional[str] = None
    currency: Optional[str] = None
    rating: Optional[float] = None
    orders: Optional[int] = None
    delivery: Optional[str] = None
    images: list = field(default_factory=list)


def _clean_number(raw: str) -> Optional[float]:
    """'4 303' / '4 303' -> 4303.0 ; '79' -> 79.0"""
    if not raw:
        return None
    digits = re.sub(r"[\s\u00a0]", "", raw)
    if not digits.isdigit():
        return None
    return float(digits)


def _extract_prices(card_text_nodes):
    """
    Возвращает (price, old_price, currency).
    Старая цена в карточке помечена line-through, текущая — крупным шрифтом,
    но чтобы не зависеть от inline-стилей, берём все денежные значения по порядку
    появления в DOM: первой идёт зачёркнутая (старая), второй — актуальная.
    """
    found = []  # (value, currency)
    for text in card_text_nodes:
        m = PRICE_RE.search(text)
        if m:
            val = _clean_number(m.group(1))
            cur = m.group(2)
            if val is not None:
                found.append((val, cur))

    price = old_price = currency = None
    if len(found) == 1:
        price, currency = found[0]
    elif len(found) >= 2:
        old_price, currency = found[0]
        price, currency = found[1]
    return price, old_price, currency


def _parse_card(link) -> Product:
    p = Product()
    p.url = link.get("href")

    # data-атрибуты лежат на внутреннем div[data-type="UniversalSnippet"]
    snippet = link.find(attrs={"data-product-id": True})
    if snippet:
        p.product_id = snippet.get("data-product-id")
        p.sku_id = snippet.get("data-sku-id")
    else:
        # fallback: вытащить id из самой ссылки
        m = re.search(r"/item/(\d+)\.html", p.url or "")
        if m:
            p.product_id = m.group(1)
        m = re.search(r"sku_id=(\d+)", p.url or "")
        if m:
            p.sku_id = m.group(1)

    # Картинки: любой <img>/<source> с CDN aliexpress-media, режем превью-суффикс.
    seen = set()
    for tag in link.find_all(["img", "source"]):
        src = tag.get("src") or tag.get("srcset") or tag.get("data-src")
        if not src or src == "undefined":
            continue
        src = src.split()[0]  # srcset может содержать "url 2x" — берём URL
        if IMAGE_HOST not in src:
            continue  # пропускаем иконки/бейджи с других доменов
        src = re.sub(r"_?\.webp$", "", src)        # .jpg_480x480.jpg_.webp -> .jpg_480x480.jpg
        src = IMAGE_THUMB_RE.sub(r".\1", src)      # -> оригинал .jpg
        # относительные //ae... ссылки приводим к https
        if src.startswith("//"):
            src = "https:" + src
        if src not in seen:
            seen.add(src)
            p.images.append(src)

    # Заголовок: элемент с атрибутом title (кроме доставки).
    # Доставка тоже имеет title, но её текст содержит цифры+₽ или слова про дни.
    titles = link.find_all(attrs={"title": True})
    title_candidates = []
    for t in titles:
        val = (t.get("title") or "").strip()
        if not val:
            continue
        # доставка: "от 149 ₽", "до 14 дней, бесплатно", "бесплатно"
        if PRICE_RE.search(val) or "беспл" in val.lower() or "дн" in val.lower():
            if p.delivery is None:
                p.delivery = val
            continue
        title_candidates.append(val)
    if title_candidates:
        # самый длинный кандидат — это название товара
        p.title = max(title_candidates, key=len)

    # Все текстовые узлы карточки для поиска цен / рейтинга / заказов
    text_nodes = [s.strip() for s in link.stripped_strings if s.strip()]

    p.price, p.old_price, p.currency = _extract_prices(text_nodes)

    for text in text_nodes:
        if p.discount is None and DISCOUNT_RE.fullmatch(text):
            p.discount = text
        if p.rating is None and RATING_RE.match(text):
            p.rating = float(text.replace(",", "."))
        if p.orders is None:
            mo = ORDERS_RE.search(text)
            if mo:
                p.orders = int(_clean_number(mo.group(1)) or 0)

    return p


def parse_products(html: str) -> list:
    """Разобрать HTML страницы/фрагмента в список Product.

    Карточки ищем по ссылкам на /item/{id}.html и дедуплицируем по
    (product_id, sku_id): один и тот же товар в разметке встречается
    несколькими вложенными <a>, а также может дублироваться в блоках
    рекомендаций.
    """
    soup = BeautifulSoup(html, "lxml")

    products = []
    seen_keys = set()
    for link in soup.find_all("a", href=ITEM_HREF_RE):
        # берём только «внешнюю» ссылку карточки: если внутри неё есть
        # ещё одна ссылка на /item/, эту пропускаем как контейнер
        if link.find("a", href=ITEM_HREF_RE):
            continue
        p = _parse_card(link)
        key = (p.product_id, p.sku_id)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        products.append(p)
    return products


def _launch_args(no_sandbox: bool) -> list:
    # Chromium refuses to run as root without --no-sandbox; --disable-dev-shm-usage
    # avoids crashes in containers with a small /dev/shm.
    return ["--no-sandbox", "--disable-dev-shm-usage"] if no_sandbox else []


def fetch_html(url: str, headless: bool = True, wait_ms: int = 4000,
               no_sandbox: bool = False) -> str:
    """
    Загрузить страницу выдачи через Playwright (нужен headless-браузер,
    т.к. AliExpress рендерит товары в JS и проверяет клиента).

    Установка:
        pip install playwright
        playwright install chromium
    """
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless, args=_launch_args(no_sandbox))
        context = browser.new_context(
            locale="ru-RU",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        # ждём появления карточек и прокручиваем для ленивой подгрузки
        try:
            page.wait_for_selector('a[href*="/item/"]', timeout=15000)
        except Exception:
            pass
        for _ in range(6):
            page.mouse.wheel(0, 3000)
            page.wait_for_timeout(wait_ms // 6)
        html = page.content()
        browser.close()
        return html


def page_url(url: str, page: int) -> str:
    """
    Вернуть тот же URL с проставленным page=<page>.

    Пагинация на AliExpress завязана на реальный query-параметр `page`,
    поэтому переход по такому URL отдаёт нужную страницу выдачи (то же,
    что делает SPA при клике по номеру). Остальные параметры сохраняем;
    `searchInfo` оставляем как есть — он привязан к поисковой сессии, но
    для смены страницы достаточно менять `page`.
    """
    parts = urlsplit(url)
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
             if k != "page"]
    query.append(("page", str(page)))
    return urlunsplit(parts._replace(query=urlencode(query)))


def extract_max_page(html: str) -> Optional[int]:
    """
    Максимальный номер страницы, видимый в блоке пагинации.

    Это НИЖНЯЯ оценка: AliExpress показывает окно вида 1 2 3 4 … , поэтому
    реальных страниц обычно больше. Достаточно, чтобы понять, что страниц
    больше одной, и как ориентир для обхода.
    """
    soup = BeautifulSoup(html, "lxml")
    pages = []
    for a in soup.find_all("a", href=PAGE_HREF_RE):
        m = PAGE_HREF_RE.search(a.get("href", ""))
        if m:
            pages.append(int(m.group(1)))
    return max(pages) if pages else None


def fetch_all_pages(url: str, max_pages: int = 5, start_page: int = 1,
                    headless: bool = True, wait_ms: int = 4000,
                    no_sandbox: bool = False) -> list:
    """
    Обойти несколько страниц выдачи в одном браузере и вернуть список
    Product со всех страниц (с дедупликацией по product_id+sku_id).

    Останавливается раньше, если очередная страница не дала новых товаров
    (признак, что страницы кончились или сработала защита).

    Установка Playwright: см. fetch_html().
    """
    from playwright.sync_api import sync_playwright

    all_products = []
    seen_keys = set()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless, args=_launch_args(no_sandbox))
        context = browser.new_context(
            locale="ru-RU",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        for n in range(start_page, start_page + max_pages):
            target = page_url(url, n)
            page.goto(target, wait_until="domcontentloaded", timeout=60000)
            try:
                page.wait_for_selector('a[href*="/item/"]', timeout=15000)
            except Exception:
                pass
            for _ in range(6):
                page.mouse.wheel(0, 3000)
                page.wait_for_timeout(wait_ms // 6)

            page_products = parse_products(page.content())
            new_on_page = 0
            for p in page_products:
                key = (p.product_id, p.sku_id)
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                all_products.append(p)
                new_on_page += 1

            print(f"Страница {n}: {len(page_products)} карточек, "
                  f"новых {new_on_page}", file=sys.stderr)
            if new_on_page == 0:
                print("Новых товаров нет — останавливаюсь.", file=sys.stderr)
                break

        browser.close()
    return all_products


def _run_with_subprocess_loop(fn, *args, **kwargs):
    """Run a blocking Playwright call in a dedicated thread under an event-loop
    policy that can spawn subprocesses.

    Playwright launches its driver as an asyncio subprocess. On Windows the
    SelectorEventLoop cannot do that — ``_make_subprocess_transport`` raises
    ``NotImplementedError`` — and some servers install exactly that policy
    (notably ``uvicorn --reload``). We run the work in a fresh thread and, on
    Windows, force the ProactorEventLoop policy there, so the loop Playwright
    creates supports subprocesses. Running in a separate thread keeps this off
    the server's own event-loop thread and lets exceptions propagate cleanly.
    """
    box = {}

    def worker():
        try:
            if sys.platform == "win32":
                asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            box["result"] = fn(*args, **kwargs)
        except BaseException as exc:  # noqa: BLE001 — re-raised on caller's thread
            box["error"] = exc

    t = threading.Thread(target=worker, name="playwright-scrape", daemon=True)
    t.start()
    t.join()
    if "error" in box:
        raise box["error"]
    return box["result"]


def _scrape_impl(url: str, pages: int, headless: bool, no_sandbox: bool) -> list[dict]:
    if pages > 1:
        products = fetch_all_pages(url, max_pages=pages, start_page=1,
                                   headless=headless, no_sandbox=no_sandbox)
    else:
        products = parse_products(fetch_html(url, headless=headless, no_sandbox=no_sandbox))
    return [asdict(p) for p in products]


def scrape(url: str, pages: int = 1, headless: bool = True, no_sandbox: bool = False) -> list[dict]:
    """
    Высокоуровневый хелпер для API: вернуть список товаров (dict) с одной
    или нескольких страниц выдачи. `pages` — сколько страниц обойти, начиная
    с первой.

    Работа с Playwright выполняется в отдельном потоке с event-loop политикой,
    поддерживающей подпроцессы (см. _run_with_subprocess_loop) — иначе под
    `uvicorn --reload` на Windows падает с NotImplementedError.
    """
    return _run_with_subprocess_loop(_scrape_impl, url, pages, headless, no_sandbox)
