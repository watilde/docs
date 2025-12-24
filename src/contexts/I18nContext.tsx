import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

export type Locale = 'en' | 'ja';

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

  // Initialize locale from URL path
  useEffect(() => {
    const pathLocale = router.pathname.startsWith('/ja') ? 'ja' : 'en';
    setLocaleState(pathLocale);
  }, [router.pathname]);

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
      
      // Update URL with locale prefix
      const currentPath = router.asPath;
      let newPath = currentPath;
      
      // Remove existing locale prefix
      if (currentPath.startsWith('/ja')) {
        newPath = currentPath.substring(3) || '/';
      } else if (currentPath.startsWith('/en')) {
        newPath = currentPath.substring(3) || '/';
      }
      
      // Add new locale prefix (skip for default 'en')
      if (newLocale === 'ja') {
        newPath = `/ja${newPath}`;
      }
      
      router.push(newPath);
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
