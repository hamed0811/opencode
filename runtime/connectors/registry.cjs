'use strict';

const registry = new Map();

function registerConnector(manifest, implementation) {
  validateManifest(manifest);
  if (!implementation || typeof implementation.healthCheck !== 'function') {
    throw new TypeError('connector_health_check_required');
  }
  if (registry.has(manifest.id)) throw new Error('connector_already_registered');
  registry.set(manifest.id, { manifest: Object.freeze({ ...manifest }), implementation });
  return registry.get(manifest.id);
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') throw new TypeError('manifest_required');
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(manifest.id || '')) throw new TypeError('invalid_connector_id');
  if (!manifest.version || !Array.isArray(manifest.capabilities) || !Array.isArray(manifest.operations)) {
    throw new TypeError('manifest_fields_missing');
  }
  for (const operation of manifest.operations) {
    if (!operation || typeof operation.id !== 'string' || !['read', 'write', 'delete', 'send', 'publish'].includes(operation.risk)) {
      throw new TypeError('invalid_operation');
    }
  }
}

function listConnectors() {
  return [...registry.values()].map(({ manifest }) => ({ ...manifest }));
}

function getConnector(id) {
  return registry.get(id);
}

async function execute(id, operationId, input, context = {}) {
  const entry = registry.get(id);
  if (!entry) throw new Error('connector_not_found');
  const operation = entry.manifest.operations.find(item => item.id === operationId);
  if (!operation) throw new Error('operation_not_found');
  if (operation.risk !== 'read' && context.approved !== true) {
    throw new Error('approval_required');
  }
  const handler = entry.implementation.operations?.[operationId];
  if (typeof handler !== 'function') throw new Error('operation_not_implemented');
  return handler(input, context);
}

async function healthCheck(id) {
  const entry = registry.get(id);
  if (!entry) throw new Error('connector_not_found');
  return entry.implementation.healthCheck();
}

module.exports = { registerConnector, validateManifest, listConnectors, getConnector, execute, healthCheck };
