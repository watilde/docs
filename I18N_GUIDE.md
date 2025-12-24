# i18n Implementation Guide

## Adding a New Language

This i18n system is designed to be easily extensible. Follow these steps to add a new language:

### 1. Update Locale Configuration

Edit `src/i18n/config.ts`:

```typescript
export const locales = ['en', 'ja', 'es'] as const; // Add 'es' for Spanish
```

### 2. Create Translation Files

Create a new directory and translation file:

```bash
mkdir -p public/locales/es
cp public/locales/en/common.json public/locales/es/common.json
```

Edit `public/locales/es/common.json` with Spanish translations.

### 3. Create Page Routes

Create a new page directory:

```bash
mkdir -p src/pages/es
```

Create `src/pages/es/index.tsx`:

```typescript
export { default } from '../index';
export { getStaticProps } from '../index';
```

### 4. Update Language Switcher (Optional)

If you want to show full language names, edit `src/components/LanguageSwitcher.tsx`:

```typescript
<option value="en">EN</option>
<option value="ja">JA</option>
<option value="es">ES</option>  // Add this
```

### That's it! 

The system will automatically:
- ✅ Detect the locale from URL (`/es`)
- ✅ Set `<html lang="es">`
- ✅ Load translations from `/locales/es/common.json`
- ✅ Handle URL routing when switching languages

## URL Structure

- English (default): `/` or `/en`
- Japanese: `/ja`
- Spanish: `/es`
- French: `/fr`
- etc.

## How It Works

### Locale Detection

`getLocaleFromPathname()` in `src/i18n/config.ts`:
- Extracts first URL segment
- Checks if it's a valid locale
- Returns locale or default

### URL Management

- `stripLocaleFromPathname()` - Removes locale prefix
- `addLocaleToPathname()` - Adds locale prefix (skips default)

### HTML Lang Attribute

`_document.tsx` automatically sets `<html lang={locale}>` based on URL.

## File Structure

```
src/
├── i18n/
│   └── config.ts                    # Locale config and utilities
├── contexts/
│   └── I18nContext.tsx              # React context for i18n
├── components/
│   └── LanguageSwitcher.tsx         # Language switcher UI
├── pages/
│   ├── index.tsx                    # English (default)
│   ├── ja/
│   │   └── index.tsx                # Japanese
│   └── [new-locale]/
│       └── index.tsx                # New language
└── public/
    └── locales/
        ├── en/common.json
        ├── ja/common.json
        └── [new-locale]/common.json
```

## Scaling to Many Languages

The system scales well because:

1. **Centralized config**: All locales defined in one place
2. **Utility functions**: Generic helpers work for any locale
3. **Dynamic routing**: No hardcoded locale checks
4. **Automatic detection**: Works with any locale in the config

## Example: Adding French

```typescript
// 1. src/i18n/config.ts
export const locales = ['en', 'ja', 'fr'] as const;

// 2. Create files
mkdir -p public/locales/fr src/pages/fr

// 3. public/locales/fr/common.json
{
  "home": {
    "title": "Documentation Amplify",
    ...
  }
}

// 4. src/pages/fr/index.tsx
export { default } from '../index';
export { getStaticProps } from '../index';
```

Done! French now works at `/fr` with `<html lang="fr">`.
