'use strict';

const { EventEmitter } = require('node:events');
const crypto = require('node:crypto');

const transitions = {
  queued: ['planning', 'cancelled'],
  planning: ['executing', 'failed', 'cancelled', 'waiting_approval'],
  executing: ['reviewing', 'failed', 'cancelled', 'waiting_approval'],
  reviewing: ['completed', 'failed', 'cancelled', 'waiting_approval'],
  waiting_approval: ['planning', 'executing', 'reviewing', 'cancelled', 'failed'],
  completed: [], failed: [], cancelled: []
};

class AgentRunner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.handlers = options.handlers || { plan: options.plan, execute: options.execute, review: options.review };
    this.runs = new Map();
  }
  createRun(task, options = {}) {
    if (typeof task !== 'string' || !task.trim()) throw new TypeError('task_required');
    const run = { id: crypto.randomUUID(), task, state: 'queued', createdAt: Date.now(), events: [], cancelled: false, parentId: options.parentId || null };
    this.runs.set(run.id, run);
    this._event(run, 'run_created', { parentId: run.parentId });
    return run.id;
  }
  getRun(id) { return this.runs.get(id) || null; }
  cancel(id) {
    const run = this.runs.get(id);
    if (!run || transitions[run.state].includes('cancelled') === false) return false;
    run.cancelled = true;
    this._transition(run, 'cancelled');
    return true;
  }
  async execute(id) {
    const run = this.runs.get(id);
    if (!run) throw new Error('run_not_found');
    if (run.state !== 'queued') throw new Error('run_not_queued');
    try {
      this._transition(run, 'planning');
      this._checkCancel(run);
      const plan = this.handlers.plan ? await this.handlers.plan(run.task, run) : { task: run.task };
      this._checkCancel(run);
      this._transition(run, 'executing');
      const result = this.handlers.execute ? await this.handlers.execute(plan, run) : { planned: true, plan };
      this._checkCancel(run);
      this._transition(run, 'reviewing');
      const review = this.handlers.review ? await this.handlers.review(result, run) : { approved: true };
      this._checkCancel(run);
      if (review && review.approved === false) throw new Error('review_rejected');
      this._transition(run, 'completed');
      return { runId: id, result, review };
    } catch (error) {
      if (run.state === 'cancelled') return { runId: id, cancelled: true };
      if (transitions[run.state].includes('failed')) this._transition(run, 'failed', { reason: error.message });
      throw error;
    }
  }
  _checkCancel(run) { if (run.cancelled) throw new Error('run_cancelled'); }
  _transition(run, next, extra = {}) {
    if (!transitions[run.state]?.includes(next)) throw new Error('invalid_transition:' + run.state + ':' + next);
    run.state = next;
    this._event(run, 'state_changed', { state: next, ...extra });
  }
  _event(run, type, payload) {
    const event = { eventId: crypto.randomUUID(), runId: run.id, type, timestamp: Date.now(), payload };
    run.events.push(event);
    this.emit('event', event);
  }
}
module.exports = { AgentRunner, transitions };
