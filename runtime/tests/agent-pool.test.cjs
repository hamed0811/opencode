'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runTasks } = require('../agent-pool.cjs');

test('task pool respects concurrency and preserves input order', async () => {
  let active = 0;
  let maximum = 0;
  const tasks = Array.from({ length: 12 }, (_, index) => async () => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 3));
    active -= 1;
    return index * 2;
  });
  const result = await runTasks(tasks, { concurrency: 3 });
  assert.equal(maximum, 3);
  assert.deepEqual(result, Array.from({ length: 12 }, (_, index) => index * 2));
});

test('task pool validates limits and stops scheduling after a failure', async () => {
  assert.throws(() => runTasks([], { concurrency: 0 }), /invalid_concurrency/);
  let started = 0;
  const tasks = [
    async () => { started += 1; throw new Error('task_failed'); },
    async () => { started += 1; return 2; },
    async () => { started += 1; return 3; }
  ];
  await assert.rejects(() => runTasks(tasks, { concurrency: 1 }), /task_failed/);
  assert.equal(started, 1);
});
