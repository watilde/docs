'use client';

import { useI18n, Locale } from '@/contexts/I18nContext';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      style={{
        padding: '0.25rem 0.5rem',
        fontSize: '0.875rem',
        borderRadius: '4px',
        border: '1px solid #ccc',
        cursor: 'pointer',
        backgroundColor: 'white',
        minWidth: 'auto',
        maxWidth: '100px'
      }}
    >
      <option value="en">EN</option>
      <option value="ja">JA</option>
    </select>
  );
}
