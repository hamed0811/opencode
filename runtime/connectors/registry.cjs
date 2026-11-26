'use strict';

const registry = new Map();
const risks = new Set(['read', 'write', 'delete', 'send', 'publish']);

function registerConnector(manifest, implementation) {
  validateManifest(manifest);
  if (!implementation || typeof implementation.healthCheck !== 'function') {
    throw new TypeError('connector_health_check_required');
  }
  if (registry.has(manifest.id)) throw new Error('connector_already_registered');
  const safeManifest = {
    id: manifest.id,
    version: manifest.version,
    capabilities: [...manifest.capabilities],
    operations: manifest.operations.map(operation => ({ id: operation.id, risk: operation.risk }))
  };
  registry.set(manifest.id, { manifest: Object.freeze(safeManifest), implementation });
  return registry.get(manifest.id);
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new TypeError('manifest_required');
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(manifest.id || '')) throw new TypeError('invalid_connector_id');
  if (typeof manifest.version !== 'string' || !manifest.version.trim() ||
      !Array.isArray(manifest.capabilities) || !Array.isArray(manifest.operations)) {
    throw new TypeError('manifest_fields_missing');
  }
  if (manifest.capabilities.some(capability => typeof capability !== 'string' || !capability.trim())) {
    throw new TypeError('invalid_capability');
  }
  const ids = new Set();
  for (const operation of manifest.operations) {
    if (!operation || typeof operation.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(operation.id) || !risks.has(operation.risk)) {
      throw new TypeError('invalid_operation');
    }
    if (ids.has(operation.id)) throw new TypeError('duplicate_operation_id');
    ids.add(operation.id);
  }
}

function listConnectors() {
  return [...registry.values()].map(({ manifest }) => ({
    ...manifest, capabilities: [...manifest.capabilities], operations: manifest.operations.map(operation => ({ ...operation }))
  }));
}

function getConnector(id) {
  return registry.get(id);
}

async function execute(id, operationId, input, context = {}) {
  const entry = registry.get(id);
  if (!entry) throw new Error('connector_not_found');
  const operation = entry.manifest.operations.find(item => item.id === operationId);
  if (!operation) throw new Error('operation_not_found');
  // Approval must be issued by a trusted host, not by model-generated context.
  // This prototype check is not a production security boundary.
  if (operation.risk !== 'read' && context.approved !== true) throw new Error('approval_required');
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
