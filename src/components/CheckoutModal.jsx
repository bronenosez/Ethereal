import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext.jsx';

const EMPTY = { name: '', country: '', city: '', street: '', zip: '', phone: '', email: '' };
const REQUIRED = ['name', 'country', 'city', 'street', 'zip', 'email'];

export default function CheckoutModal({ onClose, onBack }) {
  const { clearCart, showToast } = useStore();
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function placeOrder() {
    for (const k of REQUIRED) {
      if (!form[k].trim()) { showToast(t('checkout.fillFields'), true); return; }
    }
    clearCart();
    onClose();
    showToast(t('checkout.orderPlaced', { name: form.name.trim().split(' ')[0] }));
  }

  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal">
        <div className="modal-card">
          <h3>{t('checkout.title')}</h3>
          <p className="sub">{t('checkout.sub')}</p>
          <div className="field"><label>{t('checkout.fullName')}</label><input value={form.name} onChange={set('name')} placeholder={t('checkout.ph.name')} /></div>
          <div className="two-col">
            <div className="field"><label>{t('checkout.country')}</label><input value={form.country} onChange={set('country')} placeholder={t('checkout.ph.country')} /></div>
            <div className="field"><label>{t('checkout.city')}</label><input value={form.city} onChange={set('city')} placeholder={t('checkout.ph.city')} /></div>
          </div>
          <div className="field"><label>{t('checkout.street')}</label><input value={form.street} onChange={set('street')} placeholder={t('checkout.ph.street')} /></div>
          <div className="two-col">
            <div className="field"><label>{t('checkout.zip')}</label><input value={form.zip} onChange={set('zip')} placeholder={t('checkout.ph.zip')} /></div>
            <div className="field"><label>{t('checkout.phone')}</label><input value={form.phone} onChange={set('phone')} placeholder={t('checkout.ph.phone')} /></div>
          </div>
          <div className="field"><label>{t('checkout.email')}</label><input type="email" value={form.email} onChange={set('email')} placeholder={t('checkout.ph.email')} /></div>
          <button className="btn-primary btn-block" onClick={placeOrder}>{t('checkout.placeOrder')}</button>
          <button className="mini-btn btn-block" style={{ marginTop: 10, justifyContent: 'center' }} onClick={onBack}>{t('checkout.backToBag')}</button>
        </div>
      </div>
    </>
  );
}
