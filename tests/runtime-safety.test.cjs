const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveWorkspace, buildChildEnv, SAFE_ENV_KEYS, MAX_PROMPT_LENGTH } = require('../desktop/opencode-runner.cjs');

function tempDir(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

test('workspace resolver accepts workspace root and child directory', () => {
  const root = tempDir('council-workspace-');
  const child = path.join(root, 'project'); fs.mkdirSync(child);
  try {
    assert.equal(resolveWorkspace(root), fs.realpathSync(root));
    assert.equal(resolveWorkspace(root, 'project'), fs.realpathSync(child));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('workspace resolver rejects paths outside the workspace', () => {
  const root = tempDir('council-workspace-'); const outside = tempDir('council-outside-');
  try { assert.throws(() => resolveWorkspace(root, outside), /workspace_path_not_allowed/); }
  finally { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(outside, { recursive: true, force: true }); }
});

test('workspace resolver rejects files and non-string paths', () => {
  const root = tempDir('council-workspace-'); const file = path.join(root, 'file.txt'); fs.writeFileSync(file, 'x');
  try {
    assert.throws(() => resolveWorkspace(root, 'file.txt'), /workspace_path_must_be_directory/);
    assert.throws(() => resolveWorkspace(root, 42), /invalid_workspace_path/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('child process receives only allowlisted environment variables', () => {
  const source = { PATH: 'C:\\Windows\\System32', USERPROFILE: 'C:\\Users\\Tester', OLLAMA_HOST: 'http://127.0.0.1:11434', OPENAI_API_KEY: 'secret', GITHUB_TOKEN: 'secret', GROQ_API_KEY: 'secret', CUSTOM_SECRET: 'secret' };
  const result = buildChildEnv(source);
  assert.equal(result.PATH, source.PATH);
  assert.equal(result.OLLAMA_HOST, source.OLLAMA_HOST);
  for (const key of ['OPENAI_API_KEY','GITHUB_TOKEN','GROQ_API_KEY','CUSTOM_SECRET']) assert.equal(result[key], undefined);
  assert.ok(Object.keys(result).every(key => SAFE_ENV_KEYS.includes(key)));
});

test('prompt size limit is explicit', () => { assert.equal(MAX_PROMPT_LENGTH, 12000); });


test('execution sandbox is explicitly disabled until OS isolation exists', () => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'council.config.json'), 'utf8'));
  assert.equal(config.execution.sandbox.enabled, false);
  assert.equal(config.execution.sandbox.network, 'not_enforced');
  assert.match(config.execution.sandbox.note, /OS-level isolation backend/i);
});

test('HTML does not contain escaped newline text from accidental source insertion', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.equal(html.includes('\\\\n'), false);
});
