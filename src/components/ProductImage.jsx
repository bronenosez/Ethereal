import { useEffect, useState } from 'react';
import Placeholder from './Placeholder.jsx';

/** Renders the product image, falling back to the monogram placeholder on error. */
export default function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.img]);
  if (!product.img || failed) return <Placeholder product={product} />;
  return <img src={product.img} alt={product.name} loading="lazy" onError={() => setFailed(true)} />;
}
