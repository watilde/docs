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
  const [fallbackMessages, setFallbackMessages] = useState<Record<string, any>>(
    {}
  );

  // Detect locale from URL
  useEffect(() => {
    const pathLocale = getLocaleFromPathname(router.asPath);
    setLocaleState(pathLocale);
  }, [router.asPath]);

  // Load translations when locale changes
  useEffect(() => {
    // Always load English as fallback
    fetch(`/locales/en/common.json`)
      .then((res) => res.json())
      .then((data) => setFallbackMessages(data))
      .catch((err) =>
        console.error('Failed to load fallback translations:', err)
      );

    // Load locale-specific translations
    if (locale !== defaultLocale) {
      fetch(`/locales/${locale}/common.json`)
        .then((res) => res.json())
        .then((data) => setMessages(data))
        .catch((err) => {
          console.warn(
            `Failed to load ${locale} translations, using fallback:`,
            err
          );
          setMessages({});
        });
    } else {
      setMessages({});
    }
  }, [locale]);

  // Update HTML lang attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    // Get current path without locale
    const pathWithoutLocale = stripLocaleFromPathname(router.asPath);

    // Build new path with locale prefix
    const newPath =
      newLocale === defaultLocale
        ? pathWithoutLocale
        : `/${newLocale}${pathWithoutLocale}`;

    // Navigate to new path
    router.push(newPath);
  };

  // Translation function with fallback to English
  const t = (key: string): string => {
    const keys = key.split('.');

    // Try locale-specific translation first
    let value: any = messages;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (typeof value === 'string') {
      return value;
    }

    // Fallback to English
    value = fallbackMessages;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if not found
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
