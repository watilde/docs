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

  // Initialize locale from URL path
  useEffect(() => {
    const pathLocale = getLocaleFromPathname(router.asPath);
    setLocaleState(pathLocale);
  }, [router.asPath]);

  // Intercept route changes to preserve locale
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // If navigating to a URL without locale, add current locale
      const targetLocale = getLocaleFromPathname(url);
      
      // If URL has no locale but we have one set, add it
      if (targetLocale === 'en' && locale !== 'en' && !url.startsWith(`/${locale}`)) {
        const cleanUrl = stripLocaleFromPathname(url);
        const localizedUrl = addLocaleToPathname(cleanUrl, locale);
        
        // Only redirect if the URL actually changed
        if (localizedUrl !== url) {
          router.push(localizedUrl);
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router, locale]);

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
      
      // Get current path without locale
      const currentPath = router.asPath;
      const cleanPath = stripLocaleFromPathname(currentPath);
      
      // Add new locale prefix
      const newPath = addLocaleToPathname(cleanPath, newLocale);
      
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

export type { Locale };
