# i18n Implementation - How It Works

## Problem
Next.js static export (`output: 'export'`) doesn't support:
- Middleware
- Server-side rewrites  
- Dynamic getStaticPaths with fallback

But we want URLs like `/ja/react/start` to work!

## Solution: 404-Based Client-Side Routing

### How It Works

1. **Initial Request**
   - User accesses: `http://localhost:3000/ja/react/start`
   - File doesn't exist → Shows 404 page
   
2. **404 Page Intercepts**
   - 404 page detects `/ja/` locale prefix
   - Extracts actual path: `/react/start`
   - Uses `router.replace(actualPath, localeURL)` to load the real page
   - URL bar displays: `/ja/react/start`
   - Page renders: `/react/start` with Japanese locale context
   
3. **Link Interception**
   - All `<a>` click events are intercepted by `I18nContext`
   - If locale is `ja`, automatically add prefix:
     - Click `/react/how-amplify-works` → Navigate to `/ja/react/how-amplify-works`
   - Uses simple `router.push()` navigation
   
4. **Locale Detection**
   - `I18nContext` detects locale from URL path
   - Loads appropriate translations from `/locales/{locale}/common.json`
   - All `t()` calls show translated text
   - HTML `lang` attribute updates automatically

### File Structure

```
src/
├── contexts/
│   └── I18nContext.tsx        # Main i18n logic + link interception
├── i18n/
│   └── config.ts              # Locale utilities (getLocaleFromPathname, etc.)
├── components/
│   ├── LanguageSwitcher.tsx   # Language switcher component
│   └── LocalizedLink.tsx      # Optional localized Link wrapper
├── pages/
│   └── 404.tsx                # Custom 404 with locale redirect logic
public/
└── locales/
    ├── en/
    │   └── common.json        # English translations
    └── ja/
        └── common.json        # Japanese translations
```

### Key Files

#### `src/pages/404.tsx`
The magic happens here! Detects locale-prefixed URLs and redirects to the actual page:

```tsx
const pathLocale = getLocaleFromPathname(path);
if (pathLocale !== defaultLocale) {
  const pathWithoutLocale = stripLocaleFromPathname(path);
  router.replace(pathWithoutLocale, path, { shallow: false });
}
```

#### `src/contexts/I18nContext.tsx`
Handles:
- Locale detection from URL
- Translation loading
- Link click interception
- Locale switching

### Key Benefits

✅ **Works with static export** - No server-side logic needed
✅ **SEO-friendly URLs** - `/ja/` prefix visible in URLs  
✅ **No page duplication** - Single source of truth for all locales
✅ **Automatic locale persistence** - Links remember language choice
✅ **Clean HTML** - `<html lang="ja">` for accessibility
✅ **No navigation errors** - Prevents "hard navigate to same URL" issues

### Usage Examples

#### In Components

```tsx
import { useI18n } from '@/contexts/I18n Context';

export function MyComponent() {
  const { t, locale } = useI18n();
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

#### Adding Translations

1. Add to `public/locales/en/common.json`:
```json
{
  "myPage": {
    "title": "Hello World",
    "description": "This is my page"
  }
}
```

2. Add to `public/locales/ja/common.json`:
```json
{
  "myPage": {
    "title": "こんにちは世界",
    "description": "これは私のページです"
  }
}
```

3. Use in component:
```tsx
<h1>{t('myPage.title')}</h1>
<p>{t('myPage.description')}</p>
```

### Testing

1. Start dev server:
   ```bash
   yarn dev
   ```

2. Access English (default):
   ```
   http://localhost:3000/react/start
   ```

3. Access Japanese:
   ```
   http://localhost:3000/ja/react/start
   ```
   - Initially shows 404 briefly
   - Automatically redirects to actual page
   - URL stays as `/ja/react/start`
   - Content displays in Japanese

4. Switch language:
   - Use the language switcher in the header (top right)
   - Click any link - it will maintain the `/ja/` prefix

### Adding More Languages

To add Spanish (`es`):

1. **Update config** (`src/i18n/config.ts`):
   ```typescript
   export const locales = ['en', 'ja', 'es'] as const;
   ```

2. **Create translations**:
   ```
   public/locales/es/common.json
   ```

3. **Update LanguageSwitcher**:
   ```tsx
   <option value="es">ES</option>
   ```

That's it! The system automatically handles:
- URL routing (`/es/...`)
- Link prefixing
- Locale detection
- 404-based redirection

### Technical Details

- **404-based routing**: Leverages Next.js 404 page to handle "missing" locale URLs
- **router.replace with 'as'**: Displays localized URL while loading actual page
- **Event capture**: Intercepts clicks before Next.js Link processes them
- **Client-side only**: No server-side code, works perfectly with static export
- **Navigation state**: Uses `isNavigating` flag to prevent duplicate clicks

### Limitations

- Initial page load of `/ja/...` shows brief 404 flash
  - This is inherent to the approach (file doesn't exist)
  - Could be improved with loading state in 404 page
- Search engines see client-side routing
  - Consider adding `hreflang` tags for SEO
  - Or pre-generate all locale pages at build time
- Build output doesn't include `/ja/` HTML files
  - Files are "virtual" - generated client-side via 404 redirect

### Future Improvements

1. **Loading state in 404 page** - Show spinner during redirect
2. **Pre-generate locale pages** at build time for true static files
3. **Add hreflang tags** for better SEO
4. **Locale subdomain support** (`ja.docs.amplify.aws`)
5. **Browser locale auto-detection** from `navigator.language`
6. **Locale in localStorage** as fallback for returning users
