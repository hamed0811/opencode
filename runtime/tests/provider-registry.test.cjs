'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const registry = require('../providers/registry.cjs');

test('provider registry registers, lists and removes providers', () => {
  registry.removeProvider('registry-test');
  const provider = registry.registerOpenAICompatible({
    id: 'registry-test', baseUrl: 'https://api.example.test/v1',
    model: 'model-x', apiKeyEnv: 'REGISTRY_TEST_KEY'
  }, { env: { REGISTRY_TEST_KEY: 'test-only' } });
  assert.equal(registry.getProvider('registry-test'), provider);
  assert.deepEqual(registry.listProviders(), [{ id: 'registry-test', model: 'model-x', type: 'openai-compatible' }]);
  assert.throws(() => registry.registerOpenAICompatible({
    id: 'registry-test', baseUrl: 'https://api.example.test/v1',
    model: 'model-x', apiKeyEnv: 'REGISTRY_TEST_KEY'
  }, { env: { REGISTRY_TEST_KEY: 'test-only' } }), /provider_already_registered/);
  assert.equal(registry.removeProvider('registry-test'), true);
});
