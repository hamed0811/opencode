'use strict';

const fs = require('node:fs');
const path = require('node:path');

const supported = new Set(['fa-IR', 'en']);
function loadLocale(locale) {
  const chosen = supported.has(locale) ? locale : 'en';
  const root = __dirname;
  const fallback = JSON.parse(fs.readFileSync(path.join(root, 'en.json'), 'utf8'));
  const current = JSON.parse(fs.readFileSync(path.join(root, chosen + '.json'), 'utf8'));
  return { locale: chosen, direction: chosen === 'fa-IR' ? 'rtl' : 'ltr', messages: { ...fallback, ...current } };
}
function translate(bundle, key) {
  return bundle.messages[key] ?? key;
}
module.exports = { supportedLocales: [...supported], loadLocale, translate };
