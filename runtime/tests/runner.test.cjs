'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { AgentRunner } = require('../agent-runner.cjs');

test('run lifecycle reaches completed and emits trace events', async () => {
  const runner = new AgentRunner({ plan: async task => ({ task }), execute: async plan => ({ output: plan.task }), review: async () => ({ approved: true }) });
  const events = [];
  runner.on('event', e => events.push(e));
  const id = runner.createRun('sample task');
  const result = await runner.execute(id);
  assert.equal(result.runId, id);
  assert.equal(runner.getRun(id).state, 'completed');
  assert.deepEqual(events.map(e => e.payload.state).filter(Boolean), ['planning', 'executing', 'reviewing', 'completed']);
});

test('review rejection fails the run', async () => {
  const runner = new AgentRunner({ plan: async t => t, execute: async p => p, review: async () => ({ approved: false }) });
  const id = runner.createRun('rejected');
  await assert.rejects(() => runner.execute(id), /review_rejected/);
  assert.equal(runner.getRun(id).state, 'failed');
});

test('invalid transitions and duplicate execution are rejected', async () => {
  const runner = new AgentRunner();
  const id = runner.createRun('task');
  await runner.execute(id);
  await assert.rejects(() => runner.execute(id), /run_not_queued/);
});


test('planning failure records failed state', async () => {
  const runner = new AgentRunner({ plan: async () => { throw new Error('planning_failed'); } });
  const id = runner.createRun('broken plan');
  await assert.rejects(() => runner.execute(id), /planning_failed/);
  assert.equal(runner.getRun(id).state, 'failed');
});

test('optional event store persists run lifecycle events', async t => {
  const fs = require('node:fs/promises');
  const os = require('node:os');
  const path = require('node:path');
  const { JsonlEventStore } = require('../event-store.cjs');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'council-events-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const store = new JsonlEventStore(path.join(dir, 'runs', 'events.jsonl'));
  const runner = new AgentRunner({ eventStore: store });
  const id = runner.createRun('persist this run');
  await runner.execute(id);
  const events = await store.list({ runId: id });
  assert.deepEqual(events.map(event => event.payload.state).filter(Boolean), ['planning', 'executing', 'reviewing', 'completed']);
  assert.equal(events[0].type, 'run_created');
});
