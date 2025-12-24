import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getLocaleFromPathname, addLocaleToPathname } from '@/i18n/config';

/**
 * Hook to intercept Link clicks and add locale prefix
 */
export function useLocalizedNavigation() {
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      const href = anchor.getAttribute('href');
      if (!href) return;
      
      // Skip external links
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) {
        return;
      }
      
      // Get current locale from URL
      const currentLocale = getLocaleFromPathname(router.asPath);
      const targetLocale = getLocaleFromPathname(href);
      
      // If we're on a non-default locale and the link doesn't have locale
      if (currentLocale !== 'en' && targetLocale === 'en' && !href.startsWith(`/${currentLocale}`)) {
        e.preventDefault();
        const localizedHref = addLocaleToPathname(href, currentLocale);
        router.push(localizedHref);
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [router]);
}
