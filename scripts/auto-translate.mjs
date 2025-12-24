#!/usr/bin/env node

/**
 * Auto-translate English translations to Japanese using AI
 *
 * This script:
 * 1. Reads English translations from public/locales/en/common.json
 * 2. Translates missing Japanese keys using AI
 * 3. Updates public/locales/ja/common.json
 *
 * Models available:
 * - gemini-flash (API, high quality, free tier)
 * - opus-mt (local, fast, no API key needed)
 *
 * Usage:
 *   node scripts/auto-translate.mjs --model gemini-flash
 *   node scripts/auto-translate.mjs --model opus-mt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EN_PATH = path.join(__dirname, '../public/locales/en/common.json');
const JA_PATH = path.join(__dirname, '../public/locales/ja/common.json');

// Parse command line arguments
const args = process.argv.slice(2);
const modelIndex = args.indexOf('--model');
const model = modelIndex !== -1 ? args[modelIndex + 1] : 'gemini-flash';

console.log('🌐 Auto-translation starting...');
console.log(`📦 Using model: ${model}\n`);

// Load translation files
const enTranslations = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));
const jaTranslations = fs.existsSync(JA_PATH)
  ? JSON.parse(fs.readFileSync(JA_PATH, 'utf-8'))
  : {};

/**
 * Translate using Google Gemini Flash (API)
 */
async function translateWithGemini(text, context = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const prompt = context
    ? `Translate the following English text to Japanese. Context: ${context}\n\nText: ${text}\n\nProvide ONLY the Japanese translation, no explanations.`
    : `Translate to Japanese: ${text}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 200
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const translation = data.candidates[0].content.parts[0].text.trim();
  return translation;
}

/**
 * Translate using Opus-MT (local model via Transformers.js)
 * Note: Requires @huggingface/transformers package
 */
async function translateWithOpusMT() {
  // This would require installing @huggingface/transformers
  // For now, we'll show how it would work
  throw new Error(
    'Opus-MT support coming soon. Use --model gemini-flash for now.'
  );

  // Example implementation:
  // const { pipeline } = await import('@huggingface/transformers');
  // const translator = await pipeline('translation', 'Helsinki-NLP/opus-mt-en-ja');
  // const result = await translator(text);
  // return result[0].translation_text;
}

/**
 * Get all translation keys recursively
 */
function getKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Get value from nested object by key path
 */
function getValue(obj, keyPath) {
  return keyPath.split('.').reduce((curr, key) => curr?.[key], obj);
}

/**
 * Set value in nested object by key path
 */
function setValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((curr, key) => {
    if (!curr[key]) curr[key] = {};
    return curr[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Main translation function
 */
async function translateMissingKeys() {
  const enKeys = getKeys(enTranslations);
  const missingKeys = enKeys.filter(
    (key) => getValue(jaTranslations, key) === undefined
  );

  if (missingKeys.length === 0) {
    console.log('✅ All keys already translated!');
    return;
  }

  console.log(`📝 Found ${missingKeys.length} missing Japanese translations\n`);

  let translatedCount = 0;
  let errorCount = 0;

  for (const key of missingKeys) {
    const enText = getValue(enTranslations, key);

    // Skip non-string values
    if (typeof enText !== 'string') {
      continue;
    }

    try {
      console.log(`🔄 Translating: ${key}`);
      console.log(`   EN: ${enText}`);

      let jaText;
      if (model === 'gemini-flash') {
        // Add context from parent key
        const context = key.split('.').slice(0, -1).join(' > ');
        jaText = await translateWithGemini(enText, context);
      } else if (model === 'opus-mt') {
        jaText = await translateWithOpusMT(enText);
      } else {
        throw new Error(`Unknown model: ${model}`);
      }

      console.log(`   JA: ${jaText}\n`);

      setValue(jaTranslations, key, jaText);
      translatedCount++;

      // Rate limiting for API calls (if using Gemini)
      if (model === 'gemini-flash') {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Error translating ${key}:`, error.message);
      errorCount++;
    }
  }

  // Save updated translations
  fs.writeFileSync(JA_PATH, JSON.stringify(jaTranslations, null, 2) + '\n');

  console.log('\n📊 Translation Summary:');
  console.log(`   ✅ Translated: ${translatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Saved to: ${JA_PATH}`);
}

// Run translation
translateMissingKeys().catch((error) => {
  console.error('❌ Translation failed:', error);
  process.exit(1);
});
