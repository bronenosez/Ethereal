import { useTranslation } from 'react-i18next';
import { LANGS } from '../i18n';

// Compact language selector shown in the navbar. Persists via i18next's
// language detector (localStorage key `ethereal_lang`).
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language;

  return (
    <select
      className="lang-select"
      value={current}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label={t('language.label')}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
