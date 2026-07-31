import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/format.js';
import ProductImage from './ProductImage.jsx';

export default function ProductCard({ product }) {
  const { addToCart, showToast } = useStore();
  const { t } = useTranslation();
  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-link">
        <div className="card-img"><ProductImage product={product} /></div>
        <div className="card-body">
          <h3>{product.name}</h3>
          <p className="desc">{product.desc}</p>
        </div>
      </Link>
      <div className="card-foot">
        <span className="price">{money(product.price)}</span>
        <button
          className="add-btn"
          onClick={() => { addToCart(product.id); showToast(t('product.addedToBag')); }}
        >
          {t('product.addToBag')}
        </button>
      </div>
    </article>
  );
}
