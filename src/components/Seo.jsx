import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Site origin for absolute URLs (canonical, OG). Prefer the build-time value,
// fall back to the actual serving origin at runtime.
const SITE = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE}/og-image.webp`;

function upsertMeta(key, keyName, content) {
  const selector = `meta[${keyName}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(keyName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content ?? '');
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data) {
  const id = 'ld-page';
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Declaratively manages this page's SEO head tags. Render one per route.
 * Serialize `jsonLd` (object/array) via the caller; it's stringified here.
 */
export default function Seo({ title, description, path, image, type = 'website', noindex = false, jsonLd = null }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'en';
  const ldString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const pathname = path || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
    const url = SITE + pathname;
    const img = image ? (/^https?:\/\//.test(image) ? image : SITE + image) : DEFAULT_IMAGE;

    if (title) document.title = title;
    upsertMeta('description', 'name', description);
    upsertMeta('robots', 'name', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', url);

    upsertMeta('og:title', 'property', title);
    upsertMeta('og:description', 'property', description);
    upsertMeta('og:type', 'property', type);
    upsertMeta('og:url', 'property', url);
    upsertMeta('og:image', 'property', img);
    upsertMeta('og:locale', 'property', lang === 'ru' ? 'ru_RU' : 'en_US');

    upsertMeta('twitter:card', 'name', 'summary_large_image');
    upsertMeta('twitter:title', 'name', title);
    upsertMeta('twitter:description', 'name', description);
    upsertMeta('twitter:image', 'name', img);

    setJsonLd(ldString ? JSON.parse(ldString) : null);
  }, [title, description, path, image, type, noindex, ldString, lang]);

  return null;
}
