'use strict';

const { EventEmitter } = require('node:events');
const { spawn } = require('node:child_process');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const MAX_LINE_LENGTH = 1024 * 1024;
const MAX_ARGUMENT_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 30000;
const EXPORT_TIMEOUT_MS = 15 * 60 * 1000;

const READ_ONLY_TOOLS = new Set([
  'concat_version', 'project_list', 'timeline_read', 'project_get',
  'media_probe', 'shapes_list', 'effects_list', 'template_list',
  'preview_frame', 'project_cover', 'clips_bounds', 'export_status'
]);

const MUTATING_TOOLS = new Set([
  'project_create', 'project_open', 'project_save', 'project_close',
  'project_set_video', 'media_import', 'clip_add', 'clips_add_sequence',
  'clip_trim', 'clips_split', 'clips_move', 'clips_move_to_new_lane',
  'clips_remove', 'clip_update', 'clip_transform', 'clip_speed',
  'clip_frame', 'track_add', 'timeline_linkage', 'clip_masks',
  'mask_key_set', 'clip_stabilize', 'timeline_background', 'title_add',
  'title_style_words', 'title_clear_word_styles', 'captions_add',
  'keyframe_set', 'keyframe_clear', 'effect_layer_add', 'effect_key_set',
  'edit_apply', 'edit_undo', 'edit_redo', 'template_instantiate',
  'export_start', 'export_cancel'
]);

function resolveConcatCommand(env = process.env, platform = process.platform) {
  if (platform !== 'win32') throw new Error('concat_windows_only');
  const candidates = [
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs', 'Concat', 'concat.exe'),
    env.ProgramFiles && path.join(env.ProgramFiles, 'Concat', 'concat.exe'),
    env['ProgramFiles(x86)'] && path.join(env['ProgramFiles(x86)'], 'Concat', 'concat.exe')
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return fs.realpathSync(candidate);
    } catch {}
  }
  throw new Error('concat_not_found');
}

function buildConcatEnv(source = process.env) {
  const allowed = [
    'PATH', 'PATHEXT', 'COMSPEC', 'SYSTEMROOT', 'WINDIR', 'SYSTEMDRIVE',
    'HOMEDRIVE', 'HOMEPATH', 'USERPROFILE', 'HOME', 'APPDATA',
    'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'TEMP', 'TMP', 'OS'
  ];
  const env = {};
  for (const key of allowed) if (typeof source[key] === 'string') env[key] = source[key];
  return env;
}

class ConcatMcpClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.command = options.command || resolveConcatCommand(options.env || process.env, options.platform || process.platform);
    this.env = buildConcatEnv(options.env || process.env);
    this.spawnProcess = options.spawn || spawn;
    this.platform = options.platform || process.platform;
    this.child = null;
    this.lines = null;
    this.nextId = 1;
    this.pending = new Map();
    this.tools = [];
    this.serverInfo = null;
    this.started = false;
    this.starting = null;
  }

  async start() {
    if (this.started) return this.getStatus();
    if (this.starting) return this.starting;
    this.starting = this._start();
    try { return await this.starting; }
    finally { this.starting = null; }
  }

  async _start() {
    if (this.child) throw new Error('concat_process_already_started');
    const child = this.spawnProcess(this.command, ['--mcp', 'window'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: this.env
    });
    this.child = child;
    this.lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
    this.lines.on('line', line => this._onLine(line));
    child.stderr?.on('data', chunk => this.emit('diagnostic', String(chunk).slice(0, 1000)));
    child.on('error', error => this._failAll(new Error(error.code || 'concat_process_error')));
    child.on('exit', (code, signal) => {
      this.started = false;
      this._failAll(new Error('concat_process_exited:' + (signal || code || 'unknown')));
      this.emit('exit', { code, signal });
      this.child = null;
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('concat_start_timeout')), 10000);
      child.once('spawn', () => { clearTimeout(timer); resolve(); });
      child.once('error', error => { clearTimeout(timer); reject(new Error(error.code || 'concat_spawn_failed')); });
    });

    const initialized = await this._request('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'council-room', version: '0.1.0' }
    }, DEFAULT_TIMEOUT_MS);
    if (!initialized || typeof initialized !== 'object') throw new Error('concat_invalid_initialize_response');
    this.serverInfo = initialized.serverInfo || null;
    this._notify('notifications/initialized', {});
    this.tools = await this._listAllTools();
    if (!this.tools.some(tool => tool.name === 'concat_version')) throw new Error('concat_version_tool_missing');
    const version = await this.callTool('concat_version', {});
    this.started = true;
    return { ok: true, command: this.command, mode: 'window', serverInfo: this.serverInfo, version, tools: this.getVisibleTools() };
  }

  async _listAllTools() {
    const all = [];
    let cursor;
    do {
      const result = await this._request('tools/list', cursor ? { cursor } : {}, DEFAULT_TIMEOUT_MS);
      if (!result || !Array.isArray(result.tools)) throw new Error('concat_invalid_tools_list');
      all.push(...result.tools.filter(tool => tool && typeof tool.name === 'string' && tool.name.length <= 100));
      cursor = typeof result.nextCursor === 'string' && result.nextCursor ? result.nextCursor : null;
      if (all.length > 300) throw new Error('concat_tool_limit_exceeded');
    } while (cursor);
    return all;
  }

  getVisibleTools() {
    return this.tools.filter(tool => READ_ONLY_TOOLS.has(tool.name) || MUTATING_TOOLS.has(tool.name)).map(tool => ({
      name: tool.name,
      description: String(tool.description || '').slice(0, 1000),
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      access: READ_ONLY_TOOLS.has(tool.name) ? 'read' : 'write'
    }));
  }

  getStatus() {
    return { ok: this.started, command: this.command, mode: 'window', serverInfo: this.serverInfo, tools: this.getVisibleTools() };
  }

  async callTool(name, args = {}) {
    if (!READ_ONLY_TOOLS.has(name) && !MUTATING_TOOLS.has(name)) throw new Error('concat_tool_not_allowed');
    if (!this.child || this.child.killed) throw new Error('concat_not_connected');
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('concat_invalid_tool_arguments');
    if (Buffer.byteLength(JSON.stringify(args), 'utf8') > MAX_ARGUMENT_BYTES) throw new Error('concat_tool_arguments_too_large');
    const timeout = name === 'export_wait' ? EXPORT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
    return this._request('tools/call', { name, arguments: args }, timeout);
  }

  _request(method, params, timeoutMs) {
    if (!this.child || !this.child.stdin || this.child.killed) return Promise.reject(new Error('concat_not_connected'));
    const id = this.nextId++;
    const message = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('concat_request_timeout:' + method));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(message, error => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new Error('concat_write_failed'));
      });
    });
  }

  _notify(method, params) {
    if (!this.child?.stdin || this.child.killed) return;
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  _onLine(line) {
    if (line.length > MAX_LINE_LENGTH) {
      this._failAll(new Error('concat_response_too_large'));
      this.close();
      return;
    }
    let message;
    try { message = JSON.parse(line); }
    catch {
      this._failAll(new Error('concat_invalid_jsonrpc_response'));
      return;
    }
    if (message && typeof message.method === 'string' && message.id === undefined) {
      this.emit('notification', message);
      return;
    }
    const pending = this.pending.get(message?.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(message.id);
    if (message.error) {
      const code = Number.isFinite(message.error.code) ? message.error.code : 'unknown';
      const text = String(message.error.message || 'MCP request failed').replace(/[\r\n]+/g, ' ').slice(0, 300);
      pending.reject(new Error('concat_mcp_error:' + code + ':' + text));
    } else {
      pending.resolve(message.result);
    }
  }

  _failAll(error) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(id);
    }
  }

  close() {
    this.started = false;
    this._failAll(new Error('concat_disconnected'));
    this.lines?.close();
    this.lines = null;
    const child = this.child;
    this.child = null;
    if (!child || child.killed) return;
    if (this.platform === 'win32' && child.pid) {
      execFile('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true }, () => {});
    } else {
      child.kill();
    }
  }
}

module.exports = {
  ConcatMcpClient,
  resolveConcatCommand,
  buildConcatEnv,
  READ_ONLY_TOOLS,
  MUTATING_TOOLS,
  MAX_ARGUMENT_BYTES
};
