import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../../data/categories.js';

const EMPTY = { name: '', price: '', cat: 'skincare', img: '', desc: '' };

/**
 * Shared form for creating and editing a card.
 * Pass `initial` to edit; omit it to create.
 */
export default function ProductForm({ initial, onSubmit, submitLabel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial ? { ...initial, price: String(initial.price) } : EMPTY);
  useEffect(() => {
    setForm(initial ? { ...initial, price: String(initial.price) } : EMPTY);
  }, [initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [error, setError] = useState('');

  function submit() {
    const name = form.name.trim();
    const price = parseFloat(String(form.price).replace(',', '.'));
    if (!name) { setError(t('form.errName')); return; }
    if (Number.isNaN(price) || price < 0) { setError(t('form.errPrice')); return; }
    setError('');
    onSubmit({ name, price, cat: form.cat, img: form.img.trim(), desc: form.desc.trim() });
    if (!initial) setForm(EMPTY);
  }

  return (
    <div>
      <div className="field">
        <label>{t('form.name')}</label>
        <input value={form.name} onChange={set('name')} placeholder={t('form.namePh')} />
      </div>
      <div className="two-col">
        <div className="field">
          <label>{t('form.price')}</label>
          <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder={t('form.pricePh')} />
        </div>
        <div className="field">
          <label>{t('form.section')}</label>
          <select value={form.cat} onChange={set('cat')}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.id}.title`)}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>{t('form.image')}</label>
        <input value={form.img} onChange={set('img')} placeholder={t('form.imagePh')} />
        {form.img.trim() && (
          <div className="img-preview">
            <img src={form.img.trim()} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
      </div>
      <div className="field">
        <label>{t('form.desc')}</label>
        <textarea value={form.desc} onChange={set('desc')} placeholder={t('form.descPh')} />
      </div>
      {error && <p className="import-result err">{error}</p>}
      <button className="btn-primary" onClick={submit}>{submitLabel ?? t('form.create')}</button>
    </div>
  );
}
