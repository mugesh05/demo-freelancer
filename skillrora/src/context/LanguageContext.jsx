import { createContext, useContext, useEffect, useState } from 'react'
import { LANGUAGES, translations } from '../i18n/translations.js'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('skillrora_lang') || 'en'
  })

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  useEffect(() => {
    localStorage.setItem('skillrora_lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = currentLang.dir || 'ltr'
    if (currentLang.dir === 'rtl') {
      document.body.classList.add('rtl-layout')
    } else {
      document.body.classList.remove('rtl-layout')
    }
  }, [lang, currentLang])

  const setLang = (code) => {
    if (LANGUAGES.some((l) => l.code === code)) {
      setLangState(code)
    }
  }

  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] ?? translations.en?.[key] ?? key
    if (typeof text === 'string' && params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replaceAll(`{${k}}`, v)
      })
    }
    return text
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, currentLang, languages: LANGUAGES, dir: currentLang.dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}
