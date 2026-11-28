'use strict';

const fs = require('node:fs');
const path = require('node:path');

function createWorkspaceFilesystemConnector(options = {}) {
  if (typeof options.root !== 'string' || !options.root.trim()) throw new TypeError('workspace_root_required');
  const root = fs.realpathSync(path.resolve(options.root));
  if (!fs.statSync(root).isDirectory()) throw new TypeError('workspace_root_must_be_directory');
  const maxFileBytes = Number.isInteger(options.maxFileBytes) ? options.maxFileBytes : 1024 * 1024;
  if (maxFileBytes < 1 || maxFileBytes > 10 * 1024 * 1024) throw new RangeError('invalid_max_file_bytes');

  function insideRoot(target) {
    const relative = path.relative(root, target);
    return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
  }

  function resolveRelative(input, allowRoot = false) {
    if (typeof input !== 'string' || !input.trim() || input.includes('\0') || path.isAbsolute(input)) {
      throw new TypeError('invalid_workspace_path');
    }
    const target = path.resolve(root, input);
    if (target === root && allowRoot) return target;
    if (!insideRoot(target)) throw new Error('workspace_path_outside_root');
    return target;
  }

  async function checkedExisting(input, kind) {
    const target = resolveRelative(input, kind === 'directory');
    const actual = await fs.promises.realpath(target);
    if (actual !== root && !insideRoot(actual)) throw new Error('workspace_path_outside_root');
    const stat = await fs.promises.stat(actual);
    if (kind === 'file' && !stat.isFile()) throw new Error('workspace_file_required');
    if (kind === 'directory' && !stat.isDirectory()) throw new Error('workspace_directory_required');
    return { target: actual, stat };
  }

  return {
    healthCheck: async () => ({ ok: fs.existsSync(root), root }),
    operations: {
      async list_directory(input = {}) {
        const { target } = await checkedExisting(input.path || '.', 'directory');
        const entries = await fs.promises.readdir(target, { withFileTypes: true });
        return entries.map(entry => ({ name: entry.name, type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other' }));
      },
      async read_file(input = {}) {
        const { target, stat } = await checkedExisting(input.path, 'file');
        if (stat.size > maxFileBytes) throw new Error('workspace_file_too_large');
        return fs.promises.readFile(target, 'utf8');
      },
      async write_file(input = {}) {
        if (typeof input.content !== 'string') throw new TypeError('workspace_content_must_be_text');
        if (Buffer.byteLength(input.content, 'utf8') > maxFileBytes) throw new Error('workspace_file_too_large');
        const target = resolveRelative(input.path);
        const parent = await fs.promises.realpath(path.dirname(target));
        if (parent !== root && !insideRoot(parent)) throw new Error('workspace_path_outside_root');
        try {
          const existing = await fs.promises.realpath(target);
          if (!insideRoot(existing)) throw new Error('workspace_path_outside_root');
          if (!(await fs.promises.stat(existing)).isFile()) throw new Error('workspace_file_required');
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        await fs.promises.writeFile(target, input.content, { encoding: 'utf8', flag: 'w' });
        return { written: true, bytes: Buffer.byteLength(input.content, 'utf8') };
      }
    }
  };
}

const manifest = Object.freeze({
  id: 'workspace-filesystem',
  version: '1.0.0',
  capabilities: ['workspace:read', 'workspace:write'],
  operations: [
    { id: 'list_directory', risk: 'read' },
    { id: 'read_file', risk: 'read' },
    { id: 'write_file', risk: 'write' }
  ]
});

module.exports = { manifest, createWorkspaceFilesystemConnector };
