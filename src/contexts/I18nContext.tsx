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

  // Handle routing for locale-prefixed URLs
  useEffect(() => {
    // Check if current URL has locale prefix
    const pathLocale = getLocaleFromPathname(router.asPath);

    if (pathLocale !== defaultLocale) {
      // URL has locale prefix like /ja/react/start
      // Get the path without locale
      const pathWithoutLocale = stripLocaleFromPathname(router.asPath);

      // Update state
      setLocaleState(pathLocale);

      // Rewrite the route client-side to point to the actual page
      // This allows /ja/react/start to render /react/start with ja locale
      if (router.pathname === '/404') {
        // Only rewrite if we're on 404 (meaning the /ja/* page doesn't exist)
        router.replace(pathWithoutLocale, router.asPath, { shallow: true });
      }
    }
  }, [router]);

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

      // Check if already has locale prefix
      const hasLocalePrefix = /^\/[a-z]{2}(\/|$)/.test(href);

      // If current locale is not default and link doesn't have locale prefix
      if (locale !== defaultLocale && !hasLocalePrefix) {
        e.preventDefault();
        const localizedHref = addLocaleToPathname(href, locale);

        // Use shallow routing to update URL without actually navigating
        const actualPath = stripLocaleFromPathname(localizedHref);
        router.push(actualPath, localizedHref, { shallow: false });
      }
    };

    // Use capture phase to intercept before Next.js Link
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [locale, router]);

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
