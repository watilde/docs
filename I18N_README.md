# i18n (Internationalization) Setup

## Quick Start

```bash
# Development
yarn dev

# Production build
yarn build
```

That's it! The system automatically:
- Generates 894 Japanese pages from English sources
- Sets up routing for `/` (English) and `/ja/` (Japanese)
- Loads translations with English fallback

## Usage

### In Components

```tsx
import { useI18n } from '@/contexts/I18nContext';

function MyComponent() {
  const { t, locale } = useI18n();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>Language: {locale}</p>
    </div>
  );
}
```

### Adding Translations

**English** (`public/locales/en/common.json`):
```json
{
  "home": {
    "title": "Welcome to Amplify"
  }
}
```

**Japanese** (`public/locales/ja/common.json`):
```json
{
  "home": {
    "title": "Amplifyへようこそ"
  }
}
```

If Japanese translation is missing, English is shown automatically.

## URLs

- English: `http://localhost:3000/react/start`
- Japanese: `http://localhost:3000/ja/react/start`

## How It Works

1. **Page Generation**: `scripts/generate-locale-pages.mjs` creates `/ja/*` pages
2. **Automatic Execution**: Runs during `yarn dev` and `yarn build` (prebuild script)
3. **Re-export Strategy**: Japanese pages re-export English pages (single source of truth)
4. **Locale Detection**: `I18nContext` detects locale from URL path
5. **Translation Loading**: Loads JSON with fallback to English

## Files

- `scripts/generate-locale-pages.mjs` - Page generation script
- `src/contexts/I18nContext.tsx` - Translation and locale management
- `src/components/LanguageSwitcher.tsx` - UI for switching languages
- `src/i18n/config.ts` - Locale configuration and utilities
- `public/locales/{locale}/common.json` - Translation files
- `src/pages/ja/` - Auto-generated (gitignored)

## Adding More Languages

See [I18N_IMPLEMENTATION.md](./I18N_IMPLEMENTATION.md) for detailed instructions.

## Troubleshooting

### `@huggingface/transformers not installed` Error

If you see this warning during `yarn dev`:

```bash
⚠️  @huggingface/transformers not installed (optional)
```

**Cause**: The package is in `package.json` but not installed in `node_modules`.

**Solutions**:

1. **Install dependencies** (most common):
   ```bash
   yarn install
   ```

2. **Clean install** (if yarn.lock is out of sync):
   ```bash
   rm -rf node_modules
   yarn install
   ```

3. **Verify installation**:
   ```bash
   ls node_modules/@huggingface/transformers
   ```

4. **Manual install** (as a last resort):
   ```bash
   yarn add -D @huggingface/transformers
   ```

**Note**: Auto-translation is optional. The app works fine without it - you can add Japanese translations manually to `public/locales/ja/common.json`.

### Pages Not Generating

If Japanese pages aren't being generated:

1. **Check prebuild script runs**:
   ```bash
   yarn dev
   # Should show: "🌐 Generating Japanese locale pages..."
   ```

2. **Manually run generation**:
   ```bash
   node scripts/generate-locale-pages.mjs
   ```

3. **Check output directory**:
   ```bash
   ls src/pages/ja/
   ```

## Benefits

✅ Real URLs for each locale  
✅ Works with Next.js static export  
✅ SEO-friendly  
✅ No 404 errors  
✅ English fallback for missing translations  
✅ Automatic page generation  
✅ Single source of truth  

For detailed documentation, see [I18N_IMPLEMENTATION.md](./I18N_IMPLEMENTATION.md).
