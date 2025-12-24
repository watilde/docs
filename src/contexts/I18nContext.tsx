import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { Locale, getLocaleFromPathname, addLocaleToPathname, stripLocaleFromPathname } from '@/i18n/config';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, any>>({});

  // Initialize locale from localStorage or URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First check URL
      const pathLocale = getLocaleFromPathname(router.asPath);
      
      if (pathLocale !== 'en') {
        // URL has explicit locale
        setLocaleState(pathLocale);
        localStorage.setItem('locale', pathLocale);
      } else {
        // Check localStorage
        const savedLocale = localStorage.getItem('locale') as Locale;
        if (savedLocale && savedLocale !== 'en') {
          setLocaleState(savedLocale);
        }
      }
    }
  }, [router.asPath]);

  useEffect(() => {
    // Load translations
    fetch(`/locales/${locale}/common.json`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error('Failed to load translations:', err));
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      
      // Update HTML lang attribute dynamically
      document.documentElement.lang = newLocale;
      
      // Reload to ensure all page context uses new locale
      window.location.reload();
    }
  };

  // Simple translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export type { Locale };
