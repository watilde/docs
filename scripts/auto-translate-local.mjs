#!/usr/bin/env node

/**
 * Auto-translate using local Opus-MT model (no API key needed)
 *
 * This uses Transformers.js to run Helsinki-NLP/opus-mt-en-ja locally
 *
 * Pros:
 * - No API key needed
 * - Works offline
 * - Fast (on CPU)
 * - Free
 *
 * Cons:
 * - Need to install @huggingface/transformers
 * - First run downloads model (~300MB)
 * - Slightly lower quality than Gemini
 *
 * Usage:
 *   npm install @huggingface/transformers
 *   node scripts/auto-translate-local.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EN_PATH = path.join(__dirname, '../public/locales/en/common.json');
const JA_PATH = path.join(__dirname, '../public/locales/ja/common.json');

console.log('🌐 Auto-translation (Local Model) starting...');
console.log('📦 Using: Helsinki-NLP/opus-mt-en-jap (300MB)\n');

// Check if transformers is installed
let pipeline;
try {
  const transformers = await import('@huggingface/transformers');
  pipeline = transformers.pipeline;
} catch (error) {
  console.error('❌ @huggingface/transformers not installed');
  console.error('   Run: npm install @huggingface/transformers');
  process.exit(1);
}

// Load translation files
const enTranslations = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));
const jaTranslations = fs.existsSync(JA_PATH)
  ? JSON.parse(fs.readFileSync(JA_PATH, 'utf-8'))
  : {};

let translator = null;

/**
 * Initialize the translator (downloads model on first run)
 */
async function initTranslator() {
  if (!translator) {
    console.log(
      '⬇️  Loading translation model (first run may take a minute)...\n'
    );
    translator = await pipeline(
      'translation',
      'Xenova/opus-mt-en-jap',
      { quantized: true } // Use quantized model for faster loading
    );
    console.log('✅ Model loaded!\n');
  }
  return translator;
}

/**
 * Translate text using local model
 */
async function translate(text) {
  const t = await initTranslator();
  const result = await t(text, {
    max_length: 200,
    num_beams: 5 // Better quality
  });
  return result[0].translation_text;
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
      console.log(`🔄 ${key}`);
      console.log(`   EN: ${enText}`);

      const jaText = await translate(enText);

      console.log(`   JA: ${jaText}\n`);

      setValue(jaTranslations, key, jaText);
      translatedCount++;
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
