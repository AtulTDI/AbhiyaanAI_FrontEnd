import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

const locales = RNLocalize.getLocales();
const deviceLanguage = locales && locales.length > 0 ? locales[0].languageCode : 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: deviceLanguage,
    fallbackLng: 'en',
    resources,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;