import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/format.js';
import ProductImage from '../components/ProductImage.jsx';
import Seo from '../components/Seo.jsx';

const SITE = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, showToast } = useStore();
  const { t } = useTranslation();
  const [qty, setQty] = useState(1);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="not-found">
        <Seo title={t('seo.notFoundTitle')} description={t('product.notFoundText')} noindex />
        <h1>{t('product.notFoundTitle')}</h1>
        <p>{t('product.notFoundText')}</p>
        <Link className="btn-primary" to="/">{t('product.backToStore')}</Link>
      </div>
    );
  }

  const catTitle = t(`categories.${product.cat}.title`);
  const priceText = money(product.price);
  const seoTitle = t('seo.productTitle', { name: product.name });
  const seoDesc = product.desc
    ? product.desc.slice(0, 160)
    : t('seo.productDescription', { name: product.name, price: priceText });
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.img ? [product.img] : undefined,
      description: seoDesc,
      category: catTitle,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/product/${product.id}`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'), item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: catTitle, item: `${SITE}/?section=${product.cat}` },
        { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE}/product/${product.id}` },
      ],
    },
  ];

  return (
    <div className="product-page">
      <Seo
        title={seoTitle}
        description={seoDesc}
        path={`/product/${product.id}`}
        image={product.img || undefined}
        type="product"
        jsonLd={jsonLd}
      />
      <nav className="crumbs">
        <Link to="/">{t('nav.home')}</Link> · <Link to={`/?section=${product.cat}`}>{t(`categories.${product.cat}.title`)}</Link> · {product.name}
      </nav>
      <div className="product-layout">
        <div className="product-photo"><ProductImage product={product} /></div>
        <div className="product-info">
          <span className="chip">{t(`categories.${product.cat}.title`)}</span>
          <h1>{product.name}</h1>
          <div className="big-price">{money(product.price)}</div>
          <p className="full-desc">{product.desc || t('product.noDesc')}</p>
          <div className="buy-row">
            <div className="qty-picker">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t('product.decreaseQty')}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label={t('product.increaseQty')}>+</button>
            </div>
            <button
              className="btn-primary"
              onClick={() => { addToCart(product.id, qty); showToast(t('product.addedQty', { qty, name: product.name })); setQty(1); }}
            >
              {t('product.addToBag')}
            </button>
            <Link className="mini-btn" to={`/admin?edit=${product.id}`}>{t('product.editCard')}</Link>
          </div>
          <div className="product-meta">
            <span>{t('product.metaShips')}</span>
            <span>{t('product.metaReturns')}</span>
            <span>{t('product.metaSupport')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
