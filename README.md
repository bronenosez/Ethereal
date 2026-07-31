# Ethereal — cosmetics store (React + Vite)

A dropshipping-style cosmetics storefront with three sections (Skincare, Makeup,
Body & Hair), product cards, dedicated product pages, a cart with checkout, and
an admin panel for creating, bulk-importing, editing and deleting cards.

An authenticated **FastAPI + PostgreSQL backend** (in [`backend/`](backend/))
powers admin login and server-side AliExpress parsing.

## Run it

```bash
npm install
npm run dev        # development server (http://localhost:5173)
npm run build      # production build in dist/
npm run preview    # preview the production build
```

Requires Node.js 18+. Copy `.env.example` to `.env.local` if the backend runs
somewhere other than `http://localhost:8000`.

To use admin login and the server-side parser, also start the backend — see
[`backend/README.md`](backend/README.md).

## Admin login & access

The storefront no longer shows a public **Admin** button. Instead:

- Go to `/login` (an intentionally unlinked URL) and sign in with the admin
  credentials configured in the backend's `.env`.
- Once authenticated, the **Admin** (and **Log out**) buttons appear in the nav,
  and `/admin` becomes reachable. Unauthenticated visits to `/admin` redirect
  to `/login`.

Auth is JWT-based; the token is kept in `localStorage` and validated against the
backend's `/auth/me` on load.

## Project structure

```
index.html                     Vite entry
src/
  main.jsx                     React root, router, store provider
  App.jsx                      Routes + global layout (nav, footer, cart, toast)
  styles/global.css            Design system + all component styles
  data/
    categories.js              Section definitions + parser aliases
    seed.js                    Demo products loaded on first run
  utils/
    format.js                  Money formatting, placeholder colors
    parser.js                  Bulk-import line parser (pure functions, testable)
  context/
    StoreContext.jsx           Products + cart state, localStorage persistence
  components/
    Navbar.jsx  Hero.jsx  ValueStrip.jsx  Footer.jsx
    ProductCard.jsx  CategorySection.jsx  ProductImage.jsx  Placeholder.jsx
    CartDrawer.jsx  CheckoutModal.jsx  Toast.jsx
    admin/
      ProductForm.jsx          Shared create/edit form with image preview
      BulkImport.jsx           Pipe-format parser UI
      ManageList.jsx           Search, edit, delete
  pages/
    Home.jsx                   Hero + sections
    ProductPage.jsx            Dedicated page per card (/product/:id)
    AdminPage.jsx              Tabs: add / bulk import / manage (+ ?edit=id deep link)
```

## Routes (BrowserRouter)

- `/` — storefront
- `/product/:id` — dedicated product page
- `/login` — admin login (unlinked)
- `/admin` — admin panel, auth-guarded (`/admin?edit=p3` opens the edit modal for card p3)

The app uses `BrowserRouter`, so these are clean paths (no `#`). **This requires
the host to serve `index.html` for any unmatched path (SPA fallback)** — otherwise
loading or refreshing `/login`, `/admin`, `/product/:id` returns a 404. Vite's dev
server (`npm run dev`) and `npm run preview` both do this automatically. For a
production deploy configure a catch-all rewrite to `/index.html`, e.g.:

- **Netlify** — add `/* /index.html 200` to a `_redirects` file
- **Vercel** — a rewrite of `/(.*)` → `/index.html`
- **Nginx** — `try_files $uri /index.html;`
- **Apache** — a `FallbackResource /index.html`

## Bulk import format

One product per line:

```
Name | Price | Section | Description | Image URL
```

Description and image URL are optional. Section accepts `skincare`, `makeup`,
`bodyhair` and aliases like `body`, `hair`, `skin care`. Lines starting with `#`
are ignored. The importer reports exactly which lines failed and why.

## AliExpress parser (server-side)

The **AliExpress parser** tab in the admin panel sends a scrape request to the
backend's `POST /parse` endpoint (authenticated). The server drives a headless
browser to load an AliExpress `/wholesale` search page, parses the listing, and
returns structured products. You pick a target section, review the results with
checkboxes, and import the selected cards into the store.

The parser itself was the project-root `main.py`; it now lives at
[`backend/app/parser/aliexpress.py`](backend/app/parser/aliexpress.py) with a
`scrape()` helper the API calls. See [`backend/README.md`](backend/README.md) for
setup (including `playwright install chromium`).

## Internationalization (i18n)

The UI is translated with **react-i18next**. Two languages ship today: **English**
and **Russian**, chosen from the selector in the navbar.

- Setup and language list: [src/i18n/index.js](src/i18n/index.js)
- Translation strings: [src/i18n/en.json](src/i18n/en.json), [src/i18n/ru.json](src/i18n/ru.json)
- Language selector: [src/components/LanguageSwitcher.jsx](src/components/LanguageSwitcher.jsx)

The active language is auto-detected (saved choice → browser language, English
fallback) and persisted to `localStorage` (`ethereal_lang`). Components read
strings via `useTranslation()`'s `t('key')`; counts use i18next pluralization
(English one/other, Russian one/few/many). The `<html lang>` attribute and the
document title track the current language.

**To add a language:** create `src/i18n/<code>.json` (copy `en.json` and
translate), then add `{ code, label }` to `LANGS` in `src/i18n/index.js`.

Note: only the **UI chrome** is translated. Product names and descriptions are
content stored in the database and shown as entered.

## SEO

- **Static head** ([index.html](index.html)) — title, meta description, keywords,
  `robots`, `theme-color`, an inline SVG favicon, full Open Graph + Twitter Card
  tags, and Organization/WebSite JSON-LD. URL-based tags use `%VITE_SITE_URL%`,
  replaced at build time.
- **Per-route metadata** ([src/components/Seo.jsx](src/components/Seo.jsx)) — a
  dependency-free component that updates the title, description, canonical,
  OG/Twitter tags, `robots`, and JSON-LD per page. Rendered by each page:
  - Home → localized title/description, `index,follow`.
  - Product → `{name} — Ethereal`, product image as OG image, **Product** +
    **BreadcrumbList** JSON-LD (price in RUB, availability).
  - Login & Admin → `noindex, nofollow`.
- **Localized** — titles/descriptions and `og:locale` follow the active language
  (English/Russian); `<html lang>` tracks it too.
- **Crawling** — [public/robots.txt](public/robots.txt) (disallows `/admin`,
  `/login`) and [public/sitemap.xml](public/sitemap.xml) with the main routes.
- **Performance** — the hero LCP image has explicit dimensions + `fetchpriority`;
  product images are lazy-loaded.

**Set `VITE_SITE_URL`** to your production domain (in `.env`) so canonical/OG
URLs are correct. Also update the absolute URLs in `public/robots.txt` and
`public/sitemap.xml` (static files, not templated), and add `/product/:id` URLs
to the sitemap if you want every product indexed.

> Note: this is a client-rendered SPA. Google renders JS so the per-route tags
> are picked up, but non-JS crawlers/social scrapers only see the static
> `index.html` defaults. For guaranteed metadata on every URL, add SSR/prerendering.

## Data & persistence

Products are stored in **PostgreSQL** and served by the backend's `/products`
API. On load, the storefront fetches the list from the backend; every admin
action (add, bulk import, AliExpress import, edit, delete) writes through to the
database so inventory is shared across devices and browsers.

`localStorage` (`ethereal_products_v1`) is kept only as a write-through **cache**:
it lets the store paint instantly and keeps showing the last-known catalogue if
the backend is briefly unreachable. It is not the source of truth — the DB is —
so the backend must be running for admin changes to persist. The DB seeds itself
with the demo catalogue on first run (see `backend/app/seed_data.py`).
