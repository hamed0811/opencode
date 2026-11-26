'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { PassThrough, Writable } = require('node:stream');
const {
  ConcatMcpClient,
  resolveConcatCommand,
  buildConcatEnv,
  READ_ONLY_TOOLS,
  MUTATING_TOOLS
} = require('../desktop/concat-mcp.cjs');

function fakeSpawn() {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.killed = false;
  child.pid = 1234;
  child.kill = () => { child.killed = true; child.emit('exit', 0, null); };
  child.stdin = new Writable({
    write(chunk, _encoding, callback) {
      const message = JSON.parse(String(chunk).trim());
      if (message.id === undefined) return callback();
      let result;
      if (message.method === 'initialize') {
        result = { protocolVersion: '2025-11-25', serverInfo: { name: 'Concat', version: '0.2.12' } };
      } else if (message.method === 'tools/list') {
        result = { tools: [
          { name: 'concat_version', description: 'Version', inputSchema: { type: 'object', properties: {} } },
          { name: 'project_list', description: 'Projects', inputSchema: { type: 'object', properties: {} } },
          { name: 'project_create', description: 'Create project', inputSchema: { type: 'object', properties: { name: { type: 'string' } } } },
          { name: 'shell_exec', description: 'Must not be exposed', inputSchema: { type: 'object' } }
        ] };
      } else if (message.method === 'tools/call' && message.params.name === 'concat_version') {
        result = { content: [{ type: 'text', text: 'Concat 0.2.12' }] };
      } else if (message.method === 'tools/call' && message.params.name === 'project_list') {
        result = { content: [{ type: 'text', text: '[]' }] };
      } else {
        result = {};
      }
      queueMicrotask(() => child.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }) + '\n'));
      callback();
    }
  });
  queueMicrotask(() => child.emit('spawn'));
  return child;
}

test('Concat path resolver finds the per-user installation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'concat-install-'));
  const exe = path.join(root, 'Programs', 'Concat', 'concat.exe');
  fs.mkdirSync(path.dirname(exe), { recursive: true });
  fs.writeFileSync(exe, 'test');
  try {
    assert.equal(resolveConcatCommand({ LOCALAPPDATA: root }, 'win32'), fs.realpathSync(exe));
    assert.throws(() => resolveConcatCommand({}, 'win32'), /concat_not_found/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Concat child environment excludes API keys and arbitrary secrets', () => {
  const env = buildConcatEnv({
    PATH: 'C:\\Windows\\System32',
    LOCALAPPDATA: 'C:\\Users\\Tester\\AppData\\Local',
    OPENAI_API_KEY: 'secret',
    GITHUB_TOKEN: 'secret',
    CUSTOM_SECRET: 'secret'
  });
  assert.equal(env.PATH, 'C:\\Windows\\System32');
  assert.equal(env.OPENAI_API_KEY, undefined);
  assert.equal(env.GITHUB_TOKEN, undefined);
  assert.equal(env.CUSTOM_SECRET, undefined);
  const windowsEnv = buildConcatEnv({
    PATH: 'C:\\Users\\Tester\\bin;C:\\Windows\\System32',
    SYSTEMROOT: 'C:\\Windows',
    LOCALAPPDATA: 'C:\\Users\\Tester\\AppData\\Local'
  }, 'C:\\Users\\Tester\\AppData\\Local\\Programs\\Concat\\concat.exe', 'win32');
  assert.equal(windowsEnv.PATH.includes('C:\\Users\\Tester\\bin'), false);
  assert.match(windowsEnv.PATH, /Concat/);
  assert.equal(windowsEnv.COMSPEC, 'C:\\Windows\\System32\\cmd.exe');
});

test('Concat MCP performs initialize, lists approved tools, and calls read-only tools', async () => {
  const client = new ConcatMcpClient({
    command: 'C:\\Concat\\concat.exe',
    platform: 'linux',
    env: { PATH: '/usr/bin' },
    spawn: fakeSpawn
  });
  const status = await client.start();
  assert.equal(status.ok, true);
  assert.equal(status.mode, 'window');
  assert.equal(status.serverInfo.version, '0.2.12');
  assert.deepEqual(status.tools.map(tool => tool.name), ['concat_version', 'project_list', 'project_create']);
  const result = await client.callTool('project_list', {});
  assert.equal(result.content[0].text, '[]');
  await assert.rejects(client.callTool('timeline_read', {}), /concat_tool_unavailable/);
  await assert.rejects(client.callTool('shell_exec', {}), /concat_tool_not_allowed/);
  await assert.rejects(client.callTool('project_list', { data: 'x'.repeat(65536) }), /concat_tool_arguments_too_large/);
  client.close();
});

test('Concat MCP write tools are explicitly separated from read tools', () => {
  assert.ok(READ_ONLY_TOOLS.has('timeline_read'));
  assert.ok(MUTATING_TOOLS.has('clip_trim'));
  assert.ok(!READ_ONLY_TOOLS.has('clip_trim'));
  assert.ok(!MUTATING_TOOLS.has('project_list'));
});
