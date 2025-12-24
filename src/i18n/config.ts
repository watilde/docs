export const locales = ['en', 'ja'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export function getLocaleFromPathname(pathname: string): Locale {
  // Extract first segment from pathname
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  // Check if first segment is a valid locale
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }
  
  return defaultLocale;
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  
  if (locale === defaultLocale) {
    return pathname;
  }
  
  // Remove locale prefix
  return pathname.replace(`/${locale}`, '') || '/';
}

export function addLocaleToPathname(pathname: string, locale: Locale): string {
  // Remove any existing locale first
  const cleanPath = stripLocaleFromPathname(pathname);
  
  // Don't add prefix for default locale
  if (locale === defaultLocale) {
    return cleanPath;
  }
  
  return `/${locale}${cleanPath}`;
}