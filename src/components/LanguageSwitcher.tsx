'use client';

import { useI18n, Locale } from '@/contexts/I18nContext';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: '1px solid #ccc',
        cursor: 'pointer'
      }}
    >
      <option value="en">English</option>
      <option value="ja">日本語</option>
    </select>
  );
}
