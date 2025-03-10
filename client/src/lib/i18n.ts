import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../translations/en.json';
import it from '../translations/it.json';
import es from '../translations/es.json';

export type Language = 'en' | 'it' | 'es';

export const languages: Language[] = ['en', 'it', 'es'];
export const defaultLanguage: Language = 'en';

export const getLanguageName = (lang: Language): string => {
  const names: Record<Language, string> = {
    en: 'English',
    it: 'Italiano',
    es: 'Español'
  };
  return names[lang];
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      it: { translation: it },
      es: { translation: es }
    },
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 