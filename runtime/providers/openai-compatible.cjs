'use strict';

const DEFAULT_TIMEOUT_MS = 30000;

function normalizeProvider(config) {
  if (!config || typeof config !== 'object') throw new TypeError('provider_config_required');
  const id = String(config.id || '').trim();
  const baseUrl = String(config.baseUrl || '').trim().replace(/\/+$/, '');
  const model = String(config.model || '').trim();
  const apiKeyEnv = String(config.apiKeyEnv || '').trim();
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(id)) throw new TypeError('invalid_provider_id');
  let parsed;
  try { parsed = new URL(baseUrl); } catch { throw new TypeError('invalid_provider_url'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new TypeError('invalid_provider_url');
  }
  if (!model) throw new TypeError('provider_model_required');
  if (!/^[A-Z][A-Z0-9_]{1,127}$/.test(apiKeyEnv)) throw new TypeError('invalid_api_key_env');
  return Object.freeze({ id, baseUrl, model, apiKeyEnv });
}

function createOpenAICompatibleProvider(config, options = {}) {
  const provider = normalizeProvider(config);
  const env = options.env || process.env;
  const fetchImpl = options.fetch || globalThis.fetch;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch_not_available');

  function getHeaders() {
    const key = env[provider.apiKeyEnv];
    if (!key || !String(key).trim()) throw new Error('provider_api_key_missing');
    return { authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  }

  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${provider.baseUrl}${path}`, {
        ...init, headers: { ...getHeaders(), ...(init.headers || {}) }, signal: controller.signal
      });
      if (!response.ok) throw new Error(`provider_http_${response.status}`);
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('provider_timeout');
      if (/^provider_/.test(error.message)) throw error;
      throw new Error('provider_request_failed');
    } finally { clearTimeout(timer); }
  }

  return Object.freeze({
    id: provider.id,
    model: provider.model,
    async healthCheck() {
      const data = await request('/models', { method: 'GET' });
      return { ok: true, provider: provider.id, models: Array.isArray(data.data) ? data.data.length : 0 };
    },
    async listModels() {
      const data = await request('/models', { method: 'GET' });
      return Array.isArray(data.data) ? data.data.map(item => ({ id: String(item.id) })) : [];
    },
    async chat(messages, params = {}) {
      if (!Array.isArray(messages) || messages.length === 0) throw new TypeError('messages_required');
      const data = await request('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: params.model || provider.model,
          messages,
          ...(Number.isFinite(params.temperature) ? { temperature: params.temperature } : {}),
          ...(Number.isInteger(params.maxTokens) ? { max_tokens: params.maxTokens } : {})
        })
      });
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('provider_invalid_response');
      return { provider: provider.id, model: data.model || params.model || provider.model, text: content };
    }
  });
}

module.exports = { normalizeProvider, createOpenAICompatibleProvider };
