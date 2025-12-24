import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { addLocaleToPathname, defaultLocale } from '@/i18n/config';

interface LocalizedLinkProps extends React.ComponentProps<typeof Link> {
  href: string;
  children: React.ReactNode;
}

/**
 * A Link component that automatically adds locale prefix to URLs
 *
 * Usage:
 *   <LocalizedLink href="/react/start">React Start</LocalizedLink>
 *
 * When locale is 'ja', it becomes: /ja/react/start
 * When locale is 'en', it stays: /react/start
 */
export const LocalizedLink: React.FC<LocalizedLinkProps> = ({
  href,
  children,
  ...props
}) => {
  const { locale } = useI18n();

  // Don't add locale prefix for:
  // - External URLs (http://, https://, //)
  // - Anchor links (#)
  // - Already localized URLs (/ja/, /es/, etc.)
  const isExternal =
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//');
  const isAnchor = href.startsWith('#');
  const isAlreadyLocalized = /^\/[a-z]{2}\//.test(href);

  if (isExternal || isAnchor || isAlreadyLocalized) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  // Add locale prefix if not default locale
  const localizedHref =
    locale === defaultLocale ? href : addLocaleToPathname(href, locale);

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
};
