'use strict';

async function runTasks(tasks, options = {}) {
  if (!Array.isArray(tasks)) throw new TypeError('tasks_array_required');
  const concurrency = options.concurrency === undefined ? 1 : options.concurrency;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64) throw new RangeError('invalid_concurrency');
  if (tasks.length === 0) return [];
  const results = new Array(tasks.length);
  let nextIndex = 0;
  let failure = null;

  async function worker() {
    while (!failure) {
      if (options.signal?.aborted) {
        failure = new Error('tasks_cancelled');
        break;
      }
      const index = nextIndex++;
      if (index >= tasks.length) break;
      try {
        if (typeof tasks[index] !== 'function') throw new TypeError('task_must_be_function');
        results[index] = await tasks[index]({ index, signal: options.signal });
      } catch (error) {
        failure = error;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  if (failure) throw failure;
  return results;
}

module.exports = { runTasks };
