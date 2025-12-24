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
 * - First run downloads model (~300MB)
 * - Slightly lower quality than Gemini
 *
 * Usage:
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
console.log('📦 Using: Xenova/opus-mt-en-jap (300MB)\n');

// Check if transformers is installed
let pipeline;
try {
  const transformers = await import('@huggingface/transformers');
  pipeline = transformers.pipeline;
} catch (error) {
  console.error('❌ @huggingface/transformers not installed');
  console.error('   Run: yarn add -D @huggingface/transformers');
  console.error('   Or: npm install -D @huggingface/transformers');
  process.exit(1);
}

// Load translation files
let enTranslations, jaTranslations;
try {
  enTranslations = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));
  jaTranslations = fs.existsSync(JA_PATH)
    ? JSON.parse(fs.readFileSync(JA_PATH, 'utf-8'))
    : {};
} catch (error) {
  console.error('❌ Failed to load translation files:', error.message);
  process.exit(1);
}

let translator = null;

/**
 * Initialize the translator (downloads model on first run)
 */
async function initTranslator() {
  if (!translator) {
    console.log(
      '⬇️  Loading translation model (first run may take a minute)...'
    );
    console.log('    Model will be cached for future runs\n');
    try {
      translator = await pipeline(
        'translation',
        'Xenova/opus-mt-en-jap',
        { quantized: true } // Use quantized model for faster loading
      );
      console.log('✅ Model loaded!\n');
    } catch (error) {
      console.error('❌ Failed to load model:', error.message);
      console.error('    Try clearing cache: rm -rf ~/.cache/huggingface');
      process.exit(1);
    }
  }
  return translator;
}

/**
 * Translate text using local model
 */
async function translate(text) {
  const t = await initTranslator();

  try {
    const result = await t(text, {
      max_length: 256,
      num_beams: 4, // Balance between quality and speed
      temperature: 0.7
    });
    return result[0].translation_text;
  } catch (error) {
    console.error(`   Translation error: ${error.message}`);
    throw error;
  }
}

/**
 * Get all translation keys recursively
 */
function getKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getKeys(value, fullKey));
    } else if (typeof value === 'string') {
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
    console.log(`📊 Total keys: ${enKeys.length}\n`);
    return;
  }

  console.log(`📝 Found ${missingKeys.length} missing Japanese translations`);
  console.log(`📊 Total keys: ${enKeys.length}\n`);

  let translatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < missingKeys.length; i++) {
    const key = missingKeys[i];
    const enText = getValue(enTranslations, key);

    // Skip non-string values
    if (typeof enText !== 'string') {
      continue;
    }

    try {
      const progress = `[${i + 1}/${missingKeys.length}]`;
      console.log(`🔄 ${progress} ${key}`);
      console.log(
        `   EN: ${enText.substring(0, 80)}${enText.length > 80 ? '...' : ''}`
      );

      const jaText = await translate(enText);

      console.log(
        `   JA: ${jaText.substring(0, 80)}${jaText.length > 80 ? '...' : ''}\n`
      );

      setValue(jaTranslations, key, jaText);
      translatedCount++;
    } catch (error) {
      console.error(`❌ Error translating ${key}:`, error.message);
      errorCount++;

      // Add a placeholder to mark as attempted
      setValue(jaTranslations, key, enText);
    }
  }

  // Save updated translations
  try {
    fs.writeFileSync(JA_PATH, JSON.stringify(jaTranslations, null, 2) + '\n');
  } catch (error) {
    console.error('❌ Failed to save translations:', error.message);
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Translation Summary:');
  console.log(`   ✅ Translated: ${translatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   ⏱️  Time: ${elapsed}s`);
  console.log(`   📁 Saved to: ${JA_PATH}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errorCount > 0) {
    console.log('⚠️  Some translations failed. English text used as fallback.');
  }
}

// Run translation
translateMissingKeys().catch((error) => {
  console.error('❌ Translation failed:', error);
  process.exit(1);
});
