export const locales = ['en', 'ja'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export function getLocaleFromPathname(pathname: string): Locale {
  // Remove trailing slash and split
  const cleanPath = pathname.replace(/\/$/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const firstSegment = segments[0];

  // Check if first segment is a valid locale
  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }

  return defaultLocale;
}

export function stripLocaleFromPathname(pathname: string): string {
  const cleanPath = pathname.replace(/\/$/, '');
  const locale = getLocaleFromPathname(cleanPath);

  if (locale === defaultLocale) {
    return pathname;
  }

  // Remove locale prefix (e.g., /ja/react -> /react)
  const withoutLocale = cleanPath.replace(new RegExp(`^/${locale}(/|$)`), '/');
  return withoutLocale || '/';
}

export function addLocaleToPathname(pathname: string, locale: Locale): string {
  // Remove any existing locale first
  const cleanPath = stripLocaleFromPathname(pathname);

  // Don't add prefix for default locale
  if (locale === defaultLocale) {
    return cleanPath;
  }

  // Ensure path starts with /
  const normalizedPath = cleanPath.startsWith('/')
    ? cleanPath
    : '/' + cleanPath;

  return `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`;
}
