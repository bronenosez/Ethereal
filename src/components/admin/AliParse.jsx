import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../context/StoreContext.jsx';
import { CATEGORIES } from '../../data/categories.js';
import { apiParse } from '../../utils/api.js';
import { money } from '../../utils/format.js';

// Turn one scraped AliExpress product into a storefront card draft.
function toDraft(p, cat, t) {
  const bits = [];
  if (p.rating) bits.push(`★ ${p.rating}`);
  if (p.orders) bits.push(`${p.orders} ${t('ali.ordersSuffix')}`);
  if (p.delivery) bits.push(p.delivery);
  return {
    name: p.title || t('ali.untitled'),
    price: p.price || 0,
    cat,
    img: (p.images && p.images[0]) || '',
    desc: bits.join(' · '),
  };
}

// Admin tab: send a scrape request to our FastAPI backend, preview the results,
// and import the selected ones as product cards.
export default function AliParse() {
  const { addProducts, showToast } = useStore();
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [pages, setPages] = useState(1);
  const [cat, setCat] = useState('skincare');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState(null); // scraped list
  const [selected, setSelected] = useState(() => new Set());

  async function fetchProducts() {
    setError('');
    setProducts(null);
    if (!url.trim().startsWith('http')) {
      setError(t('ali.errUrl'));
      return;
    }
    setBusy(true);
    try {
      const { products: list } = await apiParse(url.trim(), Number(pages) || 1);
      setProducts(list);
      // pre-select every card that has both a title and a price
      const next = new Set();
      list.forEach((p, i) => {
        if (p.title && p.price) next.add(i);
      });
      setSelected(next);
      if (!list.length) setError(t('ali.noProducts'));
    } catch (err) {
      setError(err.message || 'Parsing failed');
    } finally {
      setBusy(false);
    }
  }

  function toggle(i) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function importSelected() {
    if (!products) return;
    const drafts = products.filter((_, i) => selected.has(i)).map((p) => toDraft(p, cat, t));
    if (!drafts.length) {
      setError(t('ali.errSelect'));
      return;
    }
    setBusy(true);
    try {
      await addProducts(drafts);
    } catch (err) {
      setError(err.message || 'Import failed');
      return;
    } finally {
      setBusy(false);
    }
    showToast(t('ali.importedInto', { count: drafts.length, section: t(`categories.${cat}.title`) }));
    setProducts(null);
    setSelected(new Set());
    setUrl('');
  }

  return (
    <div className="admin-card">
      <p className="hint">{t('ali.hint')}</p>

      <div className="field">
        <label>{t('ali.urlLabel')}</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('ali.urlPh')}
        />
      </div>

      <div className="two-col">
        <div className="field">
          <label>{t('ali.pagesLabel')}</label>
          <input
            type="number"
            min="1"
            max="20"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t('ali.sectionLabel')}</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.id}.title`)}</option>)}
          </select>
        </div>
      </div>

      <button className="btn-primary" onClick={fetchProducts} disabled={busy}>
        {busy ? t('ali.fetching') : t('ali.fetch')}
      </button>

      {error && <div className="import-result err" style={{ marginTop: 12 }}>{error}</div>}

      {products && products.length > 0 && (
        <>
          <div className="import-result ok" style={{ marginTop: 14 }}>
            {t('ali.found', { count: products.length, selected: selected.size })}
          </div>

          <div className="ali-grid">
            {products.map((p, i) => (
              <label key={p.product_id || i} className={'ali-item' + (selected.has(i) ? ' on' : '')}>
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} />
                <div className="ali-thumb">
                  {p.images && p.images[0]
                    ? <img src={p.images[0]} alt="" onError={(e) => { e.target.style.visibility = 'hidden'; }} />
                    : <span className="ali-noimg">{t('ali.noImage')}</span>}
                </div>
                <div className="ali-meta">
                  <div className="ali-title">{p.title || t('ali.untitled')}</div>
                  <div className="ali-price">
                    {p.price != null ? money(p.price) : '—'}
                    {p.orders ? <span className="ali-sub"> · {p.orders} {t('ali.ordersSuffix')}</span> : null}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button className="btn-primary" style={{ marginTop: 14 }} onClick={importSelected}>
            {t('ali.importBtn', { count: selected.size })}
          </button>
        </>
      )}
    </div>
  );
}
