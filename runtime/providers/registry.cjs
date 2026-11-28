'use strict';

const { createOpenAICompatibleProvider } = require('./openai-compatible.cjs');

const providers = new Map();

function registerOpenAICompatible(config, options = {}) {
  const provider = createOpenAICompatibleProvider(config, options);
  if (providers.has(provider.id)) throw new Error('provider_already_registered');
  providers.set(provider.id, provider);
  return provider;
}

function getProvider(id) { return providers.get(id) || null; }
function listProviders() {
  return [...providers.values()].map(provider => ({ id: provider.id, model: provider.model, type: 'openai-compatible' }));
}
function removeProvider(id) { return providers.delete(id); }

module.exports = { registerOpenAICompatible, getProvider, listProviders, removeProvider };
