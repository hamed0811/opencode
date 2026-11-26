'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const connectors = require('../connectors/registry.cjs');
const locales = require('../locales/index.cjs');

test('locale bundles set direction and fall back to English', () => {
  const fa = locales.loadLocale('fa-IR');
  assert.equal(fa.direction, 'rtl');
  assert.equal(locales.translate(fa, 'connectors.title'), 'اتصال‌ها');
  const en = locales.loadLocale('en');
  assert.equal(en.direction, 'ltr');
  assert.equal(locales.translate(en, 'unknown.key'), 'unknown.key');
});

test('connector write operations require approval', async () => {
  const manifest = { id: 'sample-connector', version: '1.0.0', capabilities: ['sample'], operations: [{ id: 'read', risk: 'read' }, { id: 'send', risk: 'send' }] };
  connectors.registerConnector(manifest, { healthCheck: async () => ({ ok: true }), operations: { read: async () => 'ok', send: async () => 'sent' } });
  assert.equal(await connectors.execute('sample-connector', 'read', {}), 'ok');
  await assert.rejects(() => connectors.execute('sample-connector', 'send', {}), /approval_required/);
  assert.equal(await connectors.execute('sample-connector', 'send', {}, { approved: true }), 'sent');
});


test('connector manifests reject duplicate and malformed operations', () => {
  assert.throws(() => connectors.validateManifest({ id: 'bad', version: '1', capabilities: [], operations: [{ id: 'same', risk: 'read' }, { id: 'same', risk: 'write' }] }), /duplicate_operation_id/);
  assert.throws(() => connectors.validateManifest({ id: 'bad', version: '1', capabilities: [], operations: [{ id: 'bad operation', risk: 'read' }] }), /invalid_operation/);
  assert.throws(() => connectors.validateManifest({ id: 'bad', version: '1', capabilities: [1], operations: [] }), /invalid_capability/);
});
