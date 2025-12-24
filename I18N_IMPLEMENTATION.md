# i18n Implementation - How It Works

## Problem
Next.js static export (`output: 'export'`) doesn't support:
- Middleware
- Server-side rewrites
- Dynamic getStaticPaths with fallback

But we want URLs like `/ja/react/start` to work!

## Solution: Client-Side URL Rewriting

### How It Works

1. **URL Detection**
   - User accesses: `http://localhost:3000/ja/react/start`
   - `I18nContext` detects locale from URL: `ja`
   
2. **Automatic Rewriting**
   - If `/ja/react/start` page doesn't exist (404)
   - Client-side rewrite to: `/react/start`
   - URL bar still shows: `/ja/react/start` (using Next.js `router.push(url, as)`)
   
3. **Link Interception**
   - All `<a>` click events are intercepted
   - If locale is `ja`, automatically add prefix:
     - `/react/start` → `/ja/react/start`
   - Uses `router.push(realPath, displayedPath)`

4. **Translations**
   - `I18nContext` loads `/locales/ja/common.json`
   - All `t()` calls show Japanese text
   - HTML `lang` attribute set to `ja`

### File Structure

```
src/
├── contexts/
│   └── I18nContext.tsx        # Main i18n logic
├── i18n/
│   └── config.ts              # Locale utilities
├── components/
│   └── LocalizedLink.tsx      # Optional localized Link wrapper
public/
└── locales/
    ├── en/
    │   └── common.json        # English translations
    └── ja/
        └── common.json        # Japanese translations
```

### Key Benefits

✅ **Works with static export** - No server-side logic needed
✅ **SEO-friendly URLs** - `/ja/` prefix in URLs
✅ **No page duplication** - Single source of truth
✅ **Automatic locale persistence** - Links remember language
✅ **Clean HTML** - `<html lang="ja">` for accessibility

### Usage Examples

#### In Components

```tsx
import { useI18n } from '@/contexts/I18nContext';

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

4. Switch language:
   - Use the language switcher in the header (top right)
   - Or manually change URL from `/react/start` to `/ja/react/start`

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

### Technical Details

- **Router.push 'as' parameter**: Allows displaying one URL while loading another
- **Event capture**: Intercepts clicks before Next.js Link processes them
- **Shallow routing**: Updates URL without full page reload when possible
- **Client-side only**: No server-side code, works in static export

### Limitations

- Initial page load of `/ja/...` shows brief flash (404 then rewrite)
  - Can be improved with custom 404 page
- Search engines may see this as client-side routing
  - Consider adding hreflang tags for SEO
- Build output doesn't include `/ja/` HTML files
  - Files are generated on-demand client-side

### Future Improvements

1. **Pre-generate locale pages** at build time
2. **Add hreflang tags** for better SEO
3. **Implement locale subdomain support** (`ja.docs.amplify.aws`)
4. **Add locale auto-detection** from browser settings
