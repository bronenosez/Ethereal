import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/format.js';
import ProductImage from './ProductImage.jsx';

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { cartItems, cartTotal, changeQty, showToast } = useStore();
  const { t } = useTranslation();

  return (
    <>
      <div className={'overlay' + (open ? ' show' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' show' : '')} aria-label={t('cart.title')} aria-hidden={!open}>
        <div className="drawer-head">
          <h3>{t('cart.title')}</h3>
          <button className="close-x" onClick={onClose} aria-label={t('cart.close')}>✕</button>
        </div>
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div className="empty-note">{t('cart.empty')}</div>
          ) : (
            cartItems.map(({ product, qty }) => (
              <div className="cart-row" key={product.id}>
                <div className="thumb"><ProductImage product={product} /></div>
                <div className="info">
                  <b>{product.name}</b>
                  <small>{money(product.price)}</small>
                </div>
                <div className="qty">
                  <button onClick={() => changeQty(product.id, -1)} aria-label={t('cart.decrease')}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => changeQty(product.id, 1)} aria-label={t('cart.increase')}>+</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="drawer-foot">
          <div className="total-row"><span>{t('cart.total')}</span><span>{money(cartTotal)}</span></div>
          <button
            className="btn-primary btn-block"
            onClick={() => {
              if (!cartItems.length) { showToast(t('cart.emptyToast'), true); return; }
              onCheckout();
            }}
          >
            {t('cart.checkout')}
          </button>
        </div>
      </aside>
    </>
  );
}
