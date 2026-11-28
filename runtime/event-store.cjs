'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (/(api.?key|secret|token|password|authorization|credential)/i.test(key)) output[key] = '[REDACTED]';
    else output[key] = redact(item);
  }
  return output;
}

class JsonlEventStore {
  constructor(filePath) {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new TypeError('event_store_path_required');
    this.filePath = path.resolve(filePath);
    this.writeQueue = Promise.resolve();
  }

  append(event) {
    if (!event || typeof event !== 'object' || typeof event.runId !== 'string' || typeof event.type !== 'string') {
      return Promise.reject(new TypeError('invalid_event'));
    }
    const line = JSON.stringify(redact(event)) + '\n';
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.appendFile(this.filePath, line, { encoding: 'utf8', mode: 0o600, flag: 'a' });
    });
    return this.writeQueue;
  }

  async list(options = {}) {
    await this.writeQueue;
    let content;
    try { content = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    const events = content.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
    const filtered = options.runId ? events.filter(event => event.runId === options.runId) : events;
    const limit = Number.isInteger(options.limit) ? Math.max(0, Math.min(options.limit, 10000)) : 1000;
    return limit === 0 ? [] : filtered.slice(-limit);
  }
}

module.exports = { JsonlEventStore, redact };
