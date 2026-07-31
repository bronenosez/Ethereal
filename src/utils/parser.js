import { CAT_ALIASES } from '../data/categories.js';

// Identity fallback so the parser still works (in English keys) if no
// translator is supplied, e.g. in unit tests.
const identity = (key) => key;

/**
 * Parses one product line in the pipe format:
 *   Name | Price | Section | Description? | Image URL?
 * Returns { ok: productDraft } or { err: message }.
 * `t` is an i18next-style translator used for error messages.
 */
export function parseLine(line, n, t = identity) {
  const parts = line.split('|').map((s) => s.trim());
  if (parts.length < 3) return { err: t('import.err.tooFewFields', { n }) };
  const [name, priceRaw, catRaw, desc = '', img = ''] = parts;
  if (!name) return { err: t('import.err.emptyName', { n }) };
  const price = parseFloat(priceRaw.replace(',', '.').replace(/[^\d.]/g, ''));
  if (Number.isNaN(price) || price < 0) return { err: t('import.err.invalidPrice', { n, price: priceRaw }) };
  const cat = CAT_ALIASES[catRaw.toLowerCase()];
  if (!cat) return { err: t('import.err.unknownSection', { n, section: catRaw }) };
  return { ok: { name, price, cat, desc, img } };
}

/** Parses a whole pasted block. Empty lines and lines starting with # are ignored. */
export function parseBulk(text, t = identity) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const drafts = [];
  const errors = [];
  lines.forEach((line, i) => {
    const r = parseLine(line, i + 1, t);
    if (r.err) errors.push(r.err);
    else drafts.push(r.ok);
  });
  return { drafts, errors, total: lines.length };
}
