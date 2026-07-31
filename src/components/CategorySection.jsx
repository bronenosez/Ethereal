import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext.jsx';
import ProductCard from './ProductCard.jsx';

export default function CategorySection({ category }) {
  const { products } = useStore();
  const { t } = useTranslation();
  const items = products.filter((p) => p.cat === category.id);
  return (
    <section className="section" id={category.id}>
      <div className="section-head">
        <div>
          <div className="eyebrow">{t('section.eyebrow')}</div>
          <h2>{t(`categories.${category.id}.title`)}</h2>
        </div>
        <p>{t(`categories.${category.id}.tagline`)}</p>
      </div>
      <div className="grid">
        {items.length ? (
          items.map((p) => <ProductCard key={p.id} product={p} />)
        ) : (
          <div className="empty-note">{t('section.empty')}</div>
        )}
      </div>
    </section>
  );
}
