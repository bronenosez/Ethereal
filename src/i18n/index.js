import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import ru from './ru.json';

// The languages offered in the selector. Add a new entry + JSON file to extend.
export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
];

i18n
  .use(LanguageDetector) // picks up a saved choice, then the browser language
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: 'en',
    supportedLngs: LANGS.map((l) => l.code),
    load: 'languageOnly', // treat "en-US" as "en"
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ethereal_lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false }, // React already escapes
  });

export default i18n;
