'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const connectors = require('../connectors/registry.cjs');
const { manifest, createWorkspaceFilesystemConnector } = require('../connectors/workspace-filesystem.cjs');

test('workspace filesystem reads and lists only within its root', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'council-workspace-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'hello.txt'), 'hello', 'utf8');
  const implementation = createWorkspaceFilesystemConnector({ root });
  assert.equal((await implementation.operations.read_file({ path: 'hello.txt' })), 'hello');
  assert.ok((await implementation.operations.list_directory({ path: '.' })).some(item => item.name === 'hello.txt'));
  await assert.rejects(() => implementation.operations.read_file({ path: '../outside.txt' }), /workspace_path_outside_root/);
});

test('workspace writes require host approval and reject path traversal', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'council-workspace-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const id = 'workspace-filesystem-test';
  const testManifest = { ...manifest, id };
  connectors.registerConnector(testManifest, createWorkspaceFilesystemConnector({ root }));
  await assert.rejects(() => connectors.execute(id, 'write_file', { path: 'new.txt', content: 'blocked' }), /approval_required/);
  const authority = connectors.createApprovalAuthority();
  const approval = authority.issueApproval(id, 'write_file');
  await connectors.execute(id, 'write_file', { path: 'new.txt', content: 'approved' }, { approvalAuthority: authority, approval });
  assert.equal(await fs.readFile(path.join(root, 'new.txt'), 'utf8'), 'approved');
  await assert.rejects(() => connectors.execute(id, 'write_file', { path: '../escape.txt', content: 'no' }, { approvalAuthority: authority, approval }), /workspace_path_outside_root/);
});
