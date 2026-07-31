import { placeholderBg } from '../utils/format.js';

/** Monogram placeholder shown when a product has no image (or it fails to load). */
export default function Placeholder({ product }) {
  const letter = (product.name || '').trim().charAt(0).toUpperCase() || '\u2726';
  return <div className="ph" style={{ background: placeholderBg(product) }}>{letter}</div>;
}
