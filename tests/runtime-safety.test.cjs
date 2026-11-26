const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveWorkspace, MAX_PROMPT_LENGTH } = require('../desktop/opencode-runner.cjs');

test('workspace resolver accepts the workspace root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'council-workspace-'));
  try {
    assert.equal(resolveWorkspace(root), fs.realpathSync(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('workspace resolver accepts an existing child directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'council-workspace-'));
  const child = path.join(root, 'project');
  fs.mkdirSync(child);
  try {
    assert.equal(resolveWorkspace(root, 'project'), fs.realpathSync(child));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('workspace resolver rejects a path outside the workspace', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'council-workspace-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'council-outside-'));
  try {
    assert.throws(() => resolveWorkspace(root, outside), /workspace_path_not_allowed/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('prompt size limit is explicit', () => {
  assert.equal(MAX_PROMPT_LENGTH, 12000);
});
