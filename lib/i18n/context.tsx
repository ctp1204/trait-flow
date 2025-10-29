'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'en' | 'vi' | 'ja'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('vi') // Default to Vietnamese
  const [translations, setTranslations] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const loadTranslations = async (locale: Locale) => {
    setIsLoading(true)
    try {
      const response = await import(`./locales/${locale}.json`)
      setTranslations(response.default)
    } catch (error) {
      console.error(`Failed to load translations for ${locale}:`, error)
      // Fallback to English if loading fails
      if (locale !== 'en') {
        const fallback = await import('./locales/en.json')
        setTranslations(fallback.default)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load saved locale from localStorage or detect browser language
    const savedLocale = localStorage.getItem('locale') as Locale
    const browserLang = navigator.language.split('-')[0] as Locale

    const initialLocale = savedLocale ||
      (['en', 'vi', 'ja'].includes(browserLang) ? browserLang : 'vi')

    setLocaleState(initialLocale)
    loadTranslations(initialLocale)
  }, [])

  useEffect(() => {
    loadTranslations(locale)
  }, [locale])

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: unknown = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key // Return key if translation not found
      }
    }

    let result = typeof value === 'string' ? value : key

    // Replace parameters in the translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(`{${paramKey}}`, String(paramValue))
      })
    }

    return result
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export const locales: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
]
