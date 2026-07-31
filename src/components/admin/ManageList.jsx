import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../context/StoreContext.jsx';
import { money } from '../../utils/format.js';
import ProductImage from '../ProductImage.jsx';

export default function ManageList({ onEdit }) {
  const { products, deleteProduct, deleteProducts, deleteAllProducts, showToast } = useStore();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  const items = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const allVisibleSelected = items.length > 0 && items.every((p) => selected.has(p.id));

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) items.forEach((p) => next.delete(p.id));
      else items.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function remove(p) {
    if (!window.confirm(t('manage.confirmOne', { name: p.name }))) return;
    try {
      await deleteProduct(p.id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
      showToast(t('manage.deletedToast', { name: p.name }));
    } catch (err) {
      showToast(err.message || t('manage.deleteFailed'), true);
    }
  }

  async function removeSelected() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(t('manage.confirmSelected', { count: ids.length }))) return;
    try {
      await deleteProducts(ids);
      setSelected(new Set());
      showToast(t('manage.deletedCount', { count: ids.length }));
    } catch (err) {
      showToast(err.message || t('manage.bulkDeleteFailed'), true);
    }
  }

  async function removeAll() {
    if (!products.length) return;
    if (!window.confirm(t('manage.confirmAll', { count: products.length }))) return;
    try {
      await deleteAllProducts();
      setSelected(new Set());
      showToast(t('manage.allDeleted'));
    } catch (err) {
      showToast(err.message || t('manage.deleteAllFailed'), true);
    }
  }

  return (
    <div>
      <input
        className="search-input"
        placeholder={t('manage.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {products.length > 0 && (
        <div className="manage-toolbar">
          <label className="select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
            {query ? t('manage.selectAllMatching') : t('manage.selectAll')}
          </label>
          <span className="sel-count">{t('manage.selected', { count: selected.size })}</span>
          <div className="toolbar-spacer" />
          <button className="mini-btn del" onClick={removeSelected} disabled={selected.size === 0}>
            {t('manage.deleteSelected')}
          </button>
          <button className="mini-btn del" onClick={removeAll}>{t('manage.deleteAll')}</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-note">{t('manage.empty')}</div>
      ) : (
        items.map((p) => (
          <div className={'manage-row' + (selected.has(p.id) ? ' selected' : '')} key={p.id}>
            <input
              type="checkbox"
              className="row-check"
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              aria-label={t('manage.selectRow', { name: p.name })}
            />
            <div className="thumb"><ProductImage product={p} /></div>
            <div className="m-info">
              <b><Link to={`/product/${p.id}`}>{p.name}</Link></b>
              <small>{money(p.price)}</small>
            </div>
            <span className="chip">{t(`categories.${p.cat}.title`)}</span>
            <button className="mini-btn" onClick={() => onEdit(p.id)}>{t('manage.edit')}</button>
            <button className="mini-btn del" onClick={() => remove(p)}>{t('manage.delete')}</button>
          </div>
        ))
      )}
    </div>
  );
}
