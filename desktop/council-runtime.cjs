'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const MAX_TASK_LENGTH = 5000;
const MAX_AGENT_OUTPUT = 10000;
const MAX_RUNS = 30;

const AGENTS = [
  { id: 'requirements', name: 'تحلیل‌گر نیازمندی', role: 'Requirements', system: 'درخواست را به هدف، user story، معیار پذیرش، محدودیت‌ها و موارد خارج از دامنه تبدیل کن. ابهام‌ها را مشخص کن. راه‌حل فنی را تحمیل نکن.' },
  { id: 'architect', name: 'معمار نرم‌افزار', role: 'Architect', system: 'معماری را بررسی کن. حداقل دو گزینه، trade-off، وابستگی‌ها و مسیر مهاجرت را ارائه بده. ادعاهای بدون شواهد را با برچسب فرضیه مشخص کن.' },
  { id: 'backend', name: 'متخصص بک‌اند', role: 'Backend', system: 'قرارداد runtime، API، event schema، state transition، concurrency و error handling را بررسی کن. راهکار باید idempotent و قابل تست باشد.' },
  { id: 'security', name: 'متخصص امنیت', role: 'Security', system: 'Threat model ارائه بده. Secret، shell، شبکه، permission، prompt injection، sandbox و Git را بررسی کن. ریسک بحرانی را صریح اعلام کن.' },
  { id: 'qa', name: 'متخصص تست', role: 'QA', system: 'معیارهای پذیرش را به تست‌های unit، integration، regression و E2E تبدیل کن. شکست‌ها، race condition و edge caseها را پوشش بده.' },
  { id: 'devops', name: 'متخصص DevOps', role: 'DevOps', system: 'CI، branch strategy، artifact، rollback، بسته‌بندی Windows و عملیات انتشار را بررسی کن. merge و force-push خودکار ممنوع است.' }
];

const CRITIC_SYSTEM = 'تو منتقد مستقل شورا هستی. خروجی ایجنت‌ها را با هم مقایسه کن. تناقض‌ها، فرض‌های پنهان، شکست‌های محتمل و هزینه‌های نادیده را پیدا کن. برای هر نقد، شاهد یا روش بررسی بده. اگر شواهد کافی نیست، بگو.';
const JUDGE_SYSTEM = 'تو قاضی نهایی شورای توسعه هستی. رأی اکثریت کافی نیست. امنیت، شواهد، تست، نگهداری و امکان بازگشت را وزن بده.\n' +
  'اگر veto امنیتی وجود دارد، تصمیم را REJECTED یا HUMAN_APPROVAL_REQUIRED کن.\n' +
  'هیچ عملیات merge، deploy، حذف، force-push یا اجرای تغییردهنده را انجام نده.\n' +
  'فقط JSON معتبر و بدون Markdown برگردان با این ساختار:\n' +
  '{"decision":"APPROVED|APPROVED_WITH_CONDITIONS|NEEDS_MORE_INFORMATION|REJECTED|HUMAN_APPROVAL_REQUIRED","selected_option":"...","confidence":0,"reasons":[],"rejected_options":[],"conditions":[],"risks":[],"required_human_approval":false,"next_action":"..."}\n' +
  'هر شرط باید روش verification داشته باشد.';

function redactText(value) {
  return String(value ?? '')
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
    .replace(/\b(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]{12,})\b/g, '[REDACTED]')
    .replace(/\b([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD))\s*[:=]\s*["']?[^"' \r\n]+/gi, '$1=[REDACTED]');
}

function parseJudgeResult(text) {
  const source = String(text || '');
  const first = source.indexOf('{');
  const last = source.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try {
      const parsed = JSON.parse(source.slice(first, last + 1));
      const allowed = new Set(['APPROVED','APPROVED_WITH_CONDITIONS','NEEDS_MORE_INFORMATION','REJECTED','HUMAN_APPROVAL_REQUIRED']);
      if (allowed.has(parsed.decision) && typeof parsed.confidence === 'number' && Array.isArray(parsed.reasons)) {
        return {
          decision: parsed.decision,
          selected_option: String(parsed.selected_option || ''),
          confidence: Math.max(0, Math.min(1, parsed.confidence)),
          reasons: parsed.reasons.map(String).slice(0, 12),
          rejected_options: Array.isArray(parsed.rejected_options) ? parsed.rejected_options.slice(0, 8) : [],
          conditions: Array.isArray(parsed.conditions) ? parsed.conditions.slice(0, 12) : [],
          risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 12) : [],
          required_human_approval: parsed.required_human_approval === true || parsed.decision === 'HUMAN_APPROVAL_REQUIRED',
          next_action: String(parsed.next_action || 'بررسی انسانی لازم است.')
        };
      }
    } catch {}
  }
  return {
    decision: 'NEEDS_MORE_INFORMATION',
    selected_option: '',
    confidence: 0,
    reasons: ['قاضی خروجی JSON معتبر مطابق قرارداد برنگرداند.'],
    rejected_options: [],
    conditions: [],
    risks: [{ risk: 'خروجی قاضی قابل پردازش نبود.', severity: 'high', mitigation: 'اجرای دوباره با مدل معتبر و بررسی دستی خروجی.' }],
    required_human_approval: true,
    next_action: 'خروجی قاضی باید بررسی شود.'
  };
}

function createEventStore(dataRoot) {
  fs.mkdirSync(dataRoot, { recursive: true });
  function fileFor(runId) {
    if (!/^[0-9a-f-]{36}$/i.test(runId)) throw new Error('invalid_run_id');
    return path.join(dataRoot, runId + '.jsonl');
  }
  function append(event) {
    fs.appendFileSync(fileFor(event.runId), JSON.stringify(event) + '\n', { encoding: 'utf8', mode: 0o600 });
  }
  function read(runId) {
    const file = fileFor(runId);
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  }
  function list(limit = 20) {
    return fs.readdirSync(dataRoot).filter(name => /^[0-9a-f-]{36}\.jsonl$/i.test(name))
      .map(name => ({ name, mtime: fs.statSync(path.join(dataRoot, name)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime).slice(0, Math.max(1, Math.min(limit, MAX_RUNS)))
      .map(item => read(item.name.slice(0, -6)));
  }
  return { append, read, list };
}

function createCouncilRuntime({ dataRoot, runAgent, emit = () => {}, concurrency = 5 }) {
  if (typeof runAgent !== 'function') throw new Error('run_agent_required');
  const store = createEventStore(dataRoot);
  const active = new Map();
  const approvals = new Map();

  function publish(runId, type, payload = {}) {
    const event = { runId, type, at: new Date().toISOString(), ...payload };
    if (event.content) event.content = redactText(event.content).slice(0, MAX_AGENT_OUTPUT);
    if (event.prompt) event.prompt = redactText(event.prompt).slice(0, MAX_TASK_LENGTH);
    store.append(event);
    try { emit(event); } catch {}
    return event;
  }

  async function mapConcurrent(items, limit, worker) {
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        await worker(items[index], index);
      }
    });
    await Promise.all(workers);
  }

  async function execute(run) {
    const { runId, prompt, model, controller } = run;
    try {
      publish(runId, 'run_started', { prompt, status: 'CONSULTING', agents: AGENTS.map(({ id, name, role }) => ({ id, name, role })) });
      const findings = [];
      await mapConcurrent(AGENTS, concurrency, async agent => {
        if (controller.signal.aborted) throw new Error('run_cancelled');
        publish(runId, 'agent_started', { agentId: agent.id, agentName: agent.name, role: agent.role });
        const agentPrompt = agent.system + '\n\nوظیفه:\n' + prompt + '\n\nقواعد:\n' +
          '- فقط بر اساس شواهد موجود در Workspace نظر بده.\n' +
          '- اگر فایل یا داده‌ای را ندیده‌ای، ادعای مشاهده نکن.\n' +
          '- Secret یا مقدار credential را تکرار نکن.\n' +
          '- نتیجه را با نکته‌های قابل بررسی و کوتاه ارائه بده.';
        try {
          const result = await runAgent(agentPrompt, { model, signal: controller.signal, agentId: agent.id });
          const content = redactText(result?.text || result || '').slice(0, MAX_AGENT_OUTPUT);
          if (!content.trim()) throw new Error('empty_agent_response');
          const finding = { agentId: agent.id, agentName: agent.name, role: agent.role, content };
          findings.push(finding);
          publish(runId, 'agent_completed', finding);
        } catch (error) {
          if (controller.signal.aborted) throw new Error('run_cancelled');
          const failure = { agentId: agent.id, agentName: agent.name, role: agent.role, error: String(error?.message || 'agent_failed').slice(0, 300) };
          findings.push(failure);
          publish(runId, 'agent_failed', failure);
        }
      });

      if (controller.signal.aborted) throw new Error('run_cancelled');
      const successful = findings.filter(item => item.content);
      if (!successful.length) throw new Error('all_agents_failed');

      publish(runId, 'critic_started', { agentId: 'critic', agentName: 'منتقد مخالف', role: 'Cross-Critique' });
      const evidence = successful.map(item => '## ' + item.agentName + '\n' + item.content.slice(0, 1200)).join('\n\n');
      let critique = '';
      try {
        const result = await runAgent(CRITIC_SYSTEM + '\n\nدرخواست کاربر:\n' + prompt + '\n\nیافته‌های مستقل:\n' + evidence +
          '\n\nتناقض‌ها و ریسک‌ها را با ارجاع به نام ایجنت مشخص کن.', { model, signal: controller.signal, agentId: 'critic' });
        critique = redactText(result?.text || result || '').slice(0, MAX_AGENT_OUTPUT);
        publish(runId, 'critic_completed', { agentId: 'critic', agentName: 'منتقد مخالف', role: 'Cross-Critique', content: critique });
      } catch (error) {
        if (controller.signal.aborted) throw new Error('run_cancelled');
        publish(runId, 'critic_failed', { agentId: 'critic', error: String(error?.message || 'critic_failed').slice(0, 300) });
      }

      if (controller.signal.aborted) throw new Error('run_cancelled');
      publish(runId, 'judge_started', { agentId: 'judge', agentName: 'قاضی نهایی', role: 'Final Judge' });
      const judgeInput = JUDGE_SYSTEM + '\n\nدرخواست:\n' + prompt + '\n\nیافته‌ها:\n' + evidence +
        '\n\nنقد متقابل:\n' + (critique || 'نقد متقابل در دسترس نیست.') +
        '\n\nاگر هر ایجنت شکست خورده، این محدودیت را در ریسک‌ها ثبت کن.';
      const judgeResponse = await runAgent(judgeInput, { model, signal: controller.signal, agentId: 'judge' });
      const judge = parseJudgeResult(judgeResponse?.text || judgeResponse || '');
      const approvalRequired = judge.required_human_approval || ['NEEDS_MORE_INFORMATION','REJECTED','HUMAN_APPROVAL_REQUIRED'].includes(judge.decision);
      run.approvalRequired = approvalRequired;
      approvals.set(runId, { required: approvalRequired, recorded: false });
      publish(runId, 'judge_result', { judge, approvalRequired });
      publish(runId, 'run_completed', { status: approvalRequired ? 'HUMAN_APPROVAL_REQUIRED' : 'READY_FOR_REVIEW', successfulAgents: successful.length, failedAgents: findings.length - successful.length });
    } catch (error) {
      const cancelled = controller.signal.aborted || error?.message === 'run_cancelled';
      publish(runId, cancelled ? 'run_cancelled' : 'run_failed', { status: cancelled ? 'CANCELLED' : 'FAILED', error: cancelled ? 'run_cancelled' : String(error?.message || 'run_failed').slice(0, 500) });
    } finally {
      active.delete(runId);
    }
  }

  function start(prompt, options = {}) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('prompt_empty');
    if (prompt.length > MAX_TASK_LENGTH) throw new Error('prompt_too_long');
    const runId = randomUUID();
    const run = { runId, prompt: prompt.trim(), model: typeof options.model === 'string' && options.model.trim() ? options.model.trim() : undefined, controller: new AbortController(), approvalRequired: false };
    active.set(runId, run);
    void execute(run);
    return { runId };
  }

  function cancel(runId) {
    const run = active.get(runId);
    if (!run) return { ok: false, error: 'run_not_active' };
    run.controller.abort();
    publish(runId, 'cancel_requested', {});
    return { ok: true };
  }

  function recordApproval(runId, approved, note = '') {
    let record = approvals.get(runId);
    if (!record) {
      const priorEvents = store.read(runId);
      const judgment = priorEvents.find(event => event.type === 'judge_result');
      const priorApproval = priorEvents.find(event => event.type === 'human_approval_recorded');
      if (judgment?.approvalRequired) {
        record = { required: true, recorded: Boolean(priorApproval) };
        approvals.set(runId, record);
      }
    }
    if (!record?.required) throw new Error('approval_not_required_or_run_not_finished');
    if (record.recorded) throw new Error('approval_already_recorded');
    record.recorded = true;
    const event = publish(runId, 'human_approval_recorded', {
      approved: approved === true,
      note: redactText(String(note || '')).slice(0, 1000),
      scope: 'decision acknowledgement only; no code execution, Git operation, merge, or deployment'
    });
    return { ok: true, event };
  }

  function history(limit = 20) {
    return store.list(limit).map(events => ({
      runId: events[0]?.runId,
      startedAt: events[0]?.at,
      status: events.at(-1)?.status || events.at(-1)?.type,
      events
    })).filter(item => item.runId);
  }

  return { start, cancel, recordApproval, history, readEvents: store.read };
}

module.exports = { AGENTS, redactText, parseJudgeResult, createEventStore, createCouncilRuntime, MAX_TASK_LENGTH };
