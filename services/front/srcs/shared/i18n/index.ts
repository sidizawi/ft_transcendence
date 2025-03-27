import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './translations';

i18next
  .use(LanguageDetector)
  .init({
    debug: false,
    fallbackLng: 'en',
    resources: translations,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export const i18n = i18next;