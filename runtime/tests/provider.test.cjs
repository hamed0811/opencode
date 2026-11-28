'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createOpenAICompatibleProvider, normalizeProvider } = require('../providers/openai-compatible.cjs');

async function withServer(handler, run) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try { await run(`http://127.0.0.1:${address.port}/v1`); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('provider validates configuration and rejects credential-bearing URLs', () => {
  assert.throws(() => normalizeProvider({ id: 'bad', baseUrl: 'file:///tmp', model: 'x', apiKeyEnv: 'API_KEY' }), /invalid_provider_url/);
  assert.throws(() => normalizeProvider({ id: 'bad', baseUrl: 'http://example.com/v1', model: 'x', apiKeyEnv: 'API_KEY' }), /insecure_provider_url/);
  assert.throws(() => normalizeProvider({ id: 'bad', baseUrl: 'https://user:pass@example.com/v1', model: 'x', apiKeyEnv: 'API_KEY' }), /invalid_provider_url/);
});

test('OpenAI-compatible provider discovers models and sends chat with env-only secret', async () => {
  const seen = [];
  await withServer((req, res) => {
    seen.push({ url: req.url, auth: req.headers.authorization });
    res.setHeader('content-type', 'application/json');
    if (req.url === '/v1/models') return res.end(JSON.stringify({ data: [{ id: 'model-a' }] }));
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const parsed = JSON.parse(body);
      assert.equal(parsed.model, 'model-a');
      res.end(JSON.stringify({ model: 'model-a', choices: [{ message: { content: 'hello' } }] }));
    });
  }, async baseUrl => {
    const provider = createOpenAICompatibleProvider({ id: 'test-provider', baseUrl, model: 'model-a', apiKeyEnv: 'TEST_PROVIDER_KEY' }, { env: { TEST_PROVIDER_KEY: 'test-secret' } });
    assert.deepEqual(await provider.listModels(), [{ id: 'model-a' }]);
    assert.deepEqual(await provider.chat([{ role: 'user', content: 'hi' }]), { provider: 'test-provider', model: 'model-a', text: 'hello' });
  });
  assert.equal(seen.length, 2);
  assert.ok(seen.every(item => item.auth === 'Bearer test-secret'));
});

test('provider never returns the secret in an error and fails closed without a key', async () => {
  const provider = createOpenAICompatibleProvider({ id: 'test-provider', baseUrl: 'http://127.0.0.1:1/v1', model: 'model-a', apiKeyEnv: 'MISSING_KEY' }, { env: {} });
  await assert.rejects(() => provider.healthCheck(), /provider_api_key_missing/);
});
