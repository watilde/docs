'use client';

import { useI18n, Locale } from '@/contexts/I18nContext';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      style={{
        padding: '0.25rem 0.25rem',
        fontSize: '0.75rem',
        borderRadius: '4px',
        border: '1px solid #ddd',
        cursor: 'pointer',
        backgroundColor: 'white',
        height: '32px',
        minWidth: '50px',
        maxWidth: '60px'
      }}
    >
      <option value="en">EN</option>
      <option value="ja">JA</option>
    </select>
  );
}
