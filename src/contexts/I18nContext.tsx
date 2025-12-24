import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { useRouter } from 'next/router';
import {
  Locale,
  getLocaleFromPathname,
  addLocaleToPathname,
  stripLocaleFromPathname,
  defaultLocale
} from '@/i18n/config';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [isNavigating, setIsNavigating] = useState(false);

  // Detect locale from URL
  useEffect(() => {
    const pathLocale = getLocaleFromPathname(router.asPath);
    setLocaleState(pathLocale);
  }, [router.asPath]);

  // Load translations when locale changes
  useEffect(() => {
    fetch(`/locales/${locale}/common.json`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error('Failed to load translations:', err));
  }, [locale]);

  // Intercept all link clicks to add locale prefix
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Prevent multiple rapid clicks
      if (isNavigating) {
        e.preventDefault();
        return;
      }

      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip external links, anchors, mailto, tel, etc.
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return;
      }

      // Check if href already has locale prefix
      const hrefLocale = getLocaleFromPathname(href);
      const hasCorrectLocale = hrefLocale === locale;

      // If current locale is not default and link doesn't have correct locale prefix
      if (locale !== defaultLocale && !hasCorrectLocale) {
        e.preventDefault();
        setIsNavigating(true);

        // Strip any existing locale and add current locale
        const pathWithoutLocale = stripLocaleFromPathname(href);
        const localizedHref = addLocaleToPathname(pathWithoutLocale, locale);

        // Simple navigation without 'as' parameter
        router.push(localizedHref).finally(() => {
          setIsNavigating(false);
        });
      }
    };

    // Use capture phase to intercept before Next.js Link
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [locale, router, isNavigating]);

  const setLocale = (newLocale: Locale) => {
    // Get current path without locale
    const pathWithoutLocale = stripLocaleFromPathname(router.asPath);

    // Build new path with locale prefix
    const newPath =
      newLocale === defaultLocale
        ? pathWithoutLocale
        : addLocaleToPathname(pathWithoutLocale, newLocale);

    // Update state
    setLocaleState(newLocale);

    // Navigate to new path
    router.push(newPath);
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
