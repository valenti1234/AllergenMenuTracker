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

// Funzione di debug per verificare le traduzioni
export const debugTranslations = (lang: Language) => {
  console.log(`Loading translations for ${lang}:`, {
    en: en,
    it: it,
    es: es
  }[lang]);
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
    },
    debug: true // Attiva la modalità debug per i18next
  });

// Aggiungi un listener per i cambiamenti di lingua
i18n.on('languageChanged', (lng: string) => {
  console.log(`Language changed to: ${lng}`);
  debugTranslations(lng as Language);
});

export default i18n; 