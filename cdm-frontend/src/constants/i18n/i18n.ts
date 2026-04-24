import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import koTranslationJson from './locales/ko/translation.json'
import enTranslationJson from './locales/en/translation.json'

export const LOCALE_KEY : string = 'APP_LOCALE'
export type Locale = 'ko' | 'en'

const resources = {
  ko: {
    translation: koTranslationJson
  },
  en: {
    translation: enTranslationJson
  }
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en'],
    interpolation: { escapeValue: false },

    detection: {
      // localStorage에 저장된 언어만 사용. 없으면 init의 lng(ko) 유지(브라우저 en 자동 선택 방지).
      order: ['localStorage'],
      lookupLocalStorage: LOCALE_KEY,
      caches: ['localStorage'],
    },
  })

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng.startsWith('en') ? 'en' : 'ko'
})

export default i18n;