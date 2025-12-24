import Link, { LinkProps } from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { addLocaleToPathname } from '@/i18n/config';

interface LocalizedLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function LocalizedLink({ href, children, className, ...props }: LocalizedLinkProps) {
  const { locale } = useI18n();
  
  // Don't modify external links or anchor links
  const isExternal = href.startsWith('http') || href.startsWith('//');
  const isAnchor = href.startsWith('#');
  
  if (isExternal || isAnchor) {
    return (
      <Link href={href} className={className} {...props}>
        {children}
      </Link>
    );
  }
  
  // Add locale to internal links
  const localizedHref = addLocaleToPathname(href, locale);
  
  return (
    <Link href={localizedHref} className={className} {...props}>
      {children}
    </Link>
  );
}
