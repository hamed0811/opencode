'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { redactText, parseJudgeResult, createEventStore, createCouncilRuntime } = require('../desktop/council-runtime.cjs');

function tempDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'council-runtime-')); }
function waitFor(events, type, runId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('event_timeout:' + type)), 5000);
    const off = events.on(event => {
      if (event.type === type && (!runId || event.runId === runId)) {
        clearTimeout(timeout); off(); resolve(event);
      }
    });
  });
}
function eventSink() {
  const listeners = new Set();
  return { emit: event => listeners.forEach(fn => fn(event)), on: fn => { listeners.add(fn); return () => listeners.delete(fn); } };
}

test('redacts common credentials before persistence', () => {
  const value = redactText('Bearer abcdefghijklmnop sk-abcdefghijklmnop ghp_abcdefghijklmnop OPENAI_API_KEY=secret-value');
  assert.match(value, /\[REDACTED\]/);
  assert.doesNotMatch(value, /secret-value|abcdefghijklmnop/);
});

test('judge parser validates decision and clamps confidence', () => {
  const result = parseJudgeResult('prefix {"decision":"APPROVED","confidence":4,"reasons":["ok"]} suffix');
  assert.equal(result.decision, 'APPROVED');
  assert.equal(result.confidence, 1);
  assert.equal(parseJudgeResult('not json').decision, 'NEEDS_MORE_INFORMATION');
});

test('event store appends and reads JSONL events', () => {
  const dir = tempDir();
  const store = createEventStore(dir);
  const runId = '123e4567-e89b-42d3-a456-426614174000';
  store.append({ runId, type: 'started' });
  assert.equal(store.read(runId)[0].type, 'started');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('council runs independent agents concurrently and persists final judgment', async () => {
  const dir = tempDir();
  const sink = eventSink();
  const events = [];
  sink.on(event => events.push(event));
  let current = 0;
  let peak = 0;
  const runtime = createCouncilRuntime({
    dataRoot: dir,
    concurrency: 4,
    emit: sink.emit,
    runAgent: async (_prompt, options) => {
      current += 1; peak = Math.max(peak, current);
      await new Promise(resolve => setTimeout(resolve, 15));
      current -= 1;
      if (options.agentId === 'judge') return '{"decision":"APPROVED_WITH_CONDITIONS","confidence":0.8,"reasons":["tests required"],"required_human_approval":false,"next_action":"run tests"}';
      if (options.agentId === 'critic') return 'One risk: validate the boundary.';
      return 'Independent review for ' + options.agentId;
    }
  });
  const done = waitFor(sink, 'run_completed');
  const { runId } = runtime.start('Review this project carefully.');
  const result = await done;
  assert.equal(result.runId, runId);
  assert.ok(peak >= 2, 'agents must overlap');
  assert.equal(events.filter(event => event.type === 'agent_completed').length, 6);
  assert.ok(runtime.readEvents(runId).some(event => event.type === 'judge_result'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('per-agent model overrides take precedence over the session model', async () => {
  const dir = tempDir();
  const sink = eventSink();
  const observed = new Map();
  const runtime = createCouncilRuntime({
    dataRoot: dir,
    concurrency: 6,
    agentModels: { architect: 'local/architect-model' },
    emit: sink.emit,
    runAgent: async (_prompt, options) => {
      observed.set(options.agentId, options.model || null);
      if (options.agentId === 'judge') return '{\"decision\":\"APPROVED\",\"confidence\":0.7,\"reasons\":[]}';
      return 'review';
    }
  });
  const done = waitFor(sink, 'run_completed');
  runtime.start('Check model routing.', { model: 'local/default-model' });
  await done;
  assert.equal(observed.get('architect'), 'local/architect-model');
  assert.equal(observed.get('backend'), 'local/default-model');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('active run can be cancelled and emits cancellation event', async () => {
  const dir = tempDir();
  const sink = eventSink();
  const runtime = createCouncilRuntime({
    dataRoot: dir,
    emit: sink.emit,
    runAgent: (_prompt, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    })
  });
  const { runId } = runtime.start('Cancel this run.');
  const done = waitFor(sink, 'run_cancelled', runId);
  assert.equal(runtime.cancel(runId).ok, true);
  await done;
  fs.rmSync(dir, { recursive: true, force: true });
});

test('human approval is recorded once and never runs an action', async () => {
  const dir = tempDir();
  const sink = eventSink();
  const runtime = createCouncilRuntime({
    dataRoot: dir,
    emit: sink.emit,
    runAgent: async (_prompt, options) => options.agentId === 'judge'
      ? '{"decision":"HUMAN_APPROVAL_REQUIRED","confidence":0.9,"reasons":["review needed"],"required_human_approval":true}'
      : 'review'
  });
  const done = waitFor(sink, 'run_completed');
  const { runId } = runtime.start('Need human review.');
  await done;
  const recoveredRuntime = createCouncilRuntime({ dataRoot: dir, runAgent: async () => 'unused' });
  assert.equal(recoveredRuntime.recordApproval(runId, true).ok, true);
  assert.throws(() => recoveredRuntime.recordApproval(runId, true), /approval_already_recorded/);
  fs.rmSync(dir, { recursive: true, force: true });
});
