# 🌐 Auto-Translation Setup

## TL;DR

```bash
# Option 1: API-based (Gemini Flash - High Quality)
export GEMINI_API_KEY="your_key_here"
yarn translate

# Option 2: Local Model (Opus-MT - No API Key)
npm install @huggingface/transformers
yarn translate:local

# Check translation coverage
yarn translate:check
```

## 📦 Available Models

### 1. **Gemini Flash** (Recommended) ⭐

**Pros:**
- 🎯 Very high quality
- ⚡ Fast (API-based)
- 💰 Free tier: 1500 requests/day
- 🌍 Excellent for technical docs

**Cons:**
- 🔑 Requires API key
- 🌐 Needs internet

**Setup:**
```bash
# Get API key from: https://makersuite.google.com/app/apikey
export GEMINI_API_KEY="your_key_here"

# Run translation
yarn translate
```

### 2. **Opus-MT (Local)** 🏠

**Pros:**
- 🔓 No API key needed
- 📴 Works offline
- 💰 Completely free
- ⚡ Fast on CPU

**Cons:**
- 📥 Downloads 300MB model (first run only)
- 📊 Slightly lower quality than Gemini

**Setup:**
```bash
# Install transformers
npm install @huggingface/transformers

# Run translation
yarn translate:local
```

## 🚀 Usage

### Manual Translation

```bash
# Translate missing keys using Gemini
yarn translate

# Or use local model
yarn translate:local
```

### Automatic Translation (Build Time)

Add to `package.json`:

```json
{
  "scripts": {
    "prebuild": "node src/directory/generateDirectory.mjs && node src/directory/generateFlatDirectory.mjs && node scripts/generate-locale-pages.mjs && yarn translate"
  }
}
```

Now `yarn build` will:
1. Generate directory files
2. Generate locale pages
3. **Auto-translate missing keys**
4. Build the app

### Check Translation Coverage

```bash
yarn translate:check
```

Output:
```
EN: 45 JA: 38 Missing: 7
```

## 📝 Translation Files

- **Source**: `public/locales/en/common.json`
- **Target**: `public/locales/ja/common.json`

### Example

**Before** (`public/locales/ja/common.json`):
```json
{
  "home": {
    "title": "Amplifyドキュメント"
  }
}
```

**After running `yarn translate`**:
```json
{
  "home": {
    "title": "Amplifyドキュメント",
    "description": "AWSでフルスタックアプリを構築",
    "getStarted": "始める"
  }
}
```

## 🔧 How It Works

### Gemini Flash Mode

1. Reads `public/locales/en/common.json`
2. Compares with `public/locales/ja/common.json`
3. Finds missing keys
4. For each missing key:
   - Sends English text to Gemini API
   - Includes context from parent keys
   - Gets Japanese translation
   - Updates Japanese file
5. Saves updated `common.json`

### Local Mode (Opus-MT)

1. Downloads `Helsinki-NLP/opus-mt-en-jap` model (first run only)
2. Loads model into memory
3. Translates missing keys locally
4. No internet required after first download

## 🎯 Quality Comparison

| Model | Quality | Speed | Cost | Offline |
|-------|---------|-------|------|---------|
| Gemini Flash | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | Free* | ❌ |
| Opus-MT | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | Free | ✅ |

*Free tier: 1500 requests/day

### Example Translations

**English:** "Build full-stack apps with AWS Amplify"

- **Gemini Flash:** "AWS Amplifyでフルスタックアプリを構築"
- **Opus-MT:** "AWSアンプリファイでフルスタックアプリを構築"

Both are good, Gemini slightly more natural.

## 🔐 Environment Variables

Create `.env.i18n`:

```bash
# For Gemini Flash
GEMINI_API_KEY=your_api_key_here

# Optional: For OpenAI (future support)
# OPENAI_API_KEY=your_openai_key_here
```

Load it:
```bash
source .env.i18n
yarn translate
```

Or inline:
```bash
GEMINI_API_KEY=your_key yarn translate
```

## 🛠️ Advanced Usage

### Batch Translation

Translate all at once:
```bash
yarn translate
```

### Selective Translation

Edit script to translate specific keys:
```javascript
const keysToTranslate = ['home.title', 'home.description'];
```

### Custom Models

Edit `scripts/auto-translate.mjs`:
```javascript
// Add support for other models
if (model === 'gpt-4') {
  jaText = await translateWithGPT4(enText);
}
```

## 📊 Translation Stats

After translation:
```bash
yarn translate:check
```

Output shows:
- Total English keys
- Total Japanese keys
- Missing translations

## 🚨 Troubleshooting

### API Key Not Working

```bash
# Check if key is set
echo $GEMINI_API_KEY

# Test API directly
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=$GEMINI_API_KEY
```

### Model Download Fails (Local)

```bash
# Clear cache and retry
rm -rf ~/.cache/huggingface
yarn translate:local
```

### Rate Limiting

Gemini free tier: 1500 requests/day

If you hit limit:
- Wait 24 hours, or
- Use local model: `yarn translate:local`

## 🎨 Customization

### Change Translation Context

Edit `scripts/auto-translate.mjs`:

```javascript
const prompt = `
You are translating AWS Amplify documentation.
Translate technically accurate Japanese suitable for developers.

English: ${text}
Japanese:`;
```

### Change Model Parameters

```javascript
generationConfig: {
  temperature: 0.3,  // Lower = more consistent
  maxOutputTokens: 200
}
```

## 🔮 Future Enhancements

- [ ] Support for more languages (ES, FR, DE)
- [ ] OpenAI GPT-4 support
- [ ] Claude API support
- [ ] Translation memory (reuse previous translations)
- [ ] Glossary support (technical terms)
- [ ] Plural forms handling
- [ ] Variables/placeholders preservation

## 📚 Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [Transformers.js Docs](https://huggingface.co/docs/transformers.js)
- [Helsinki-NLP Models](https://huggingface.co/Helsinki-NLP)

---

## Summary

**For best quality:** Use Gemini Flash (`yarn translate`)  
**For offline/free:** Use Opus-MT (`yarn translate:local`)  
**For CI/CD:** Use Gemini with API key in secrets
