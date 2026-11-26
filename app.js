const agents = [
  { id: 'pm', name: 'پرشین', role: 'هماهنگ‌کننده شورا', initial: 'پ', cls: 'judge-avatar', status: 'آماده', statusCls: '', active: false },
  { id: 'requirements', name: 'تحلیل‌گر نیازمندی', role: 'معیار پذیرش و دامنه', initial: 'ن', cls: 'judge-avatar', status: 'آماده', statusCls: '' },
  { id: 'architect', name: 'معمار نرم‌افزار', role: 'معماری و طراحی', initial: 'م', cls: 'architect-avatar', status: 'آماده', statusCls: '' },
  { id: 'backend', name: 'متخصص بک‌اند', role: 'Runtime و API', initial: 'ب', cls: 'backend-avatar', status: 'آماده', statusCls: '' },
  { id: 'security', name: 'متخصص امنیت', role: 'Threat model و مجوزها', initial: 'ا', cls: 'security-avatar', status: 'آماده', statusCls: '' },
  { id: 'qa', name: 'متخصص تست', role: 'تست و کیفیت', initial: 'ت', cls: 'qa-avatar', status: 'آماده', statusCls: '' },
  { id: 'devops', name: 'متخصص DevOps', role: 'CI و انتشار', initial: 'د', cls: 'devops-avatar', status: 'آماده', statusCls: '' },
  { id: 'critic', name: 'منتقد مخالف', role: 'نقد متقابل', initial: 'ن', cls: 'critic-avatar', status: 'پس از مشورت', statusCls: '' },
  { id: 'judge', name: 'قاضی نهایی', role: 'حکم مبتنی بر شواهد', initial: 'ق', cls: 'judge-avatar', status: 'پس از نقد', statusCls: '' }
];
const messages = [];

const defaultGatewayProfiles = [
  { id: 'opencode-local', name: 'OpenCode محلی', type: 'local-cli', command: 'opencode', model: 'کاتالوگ OpenCode', freeModelsOnly: true, enabled: true, keyConfigured: true, note: 'درگاه پیش‌فرض؛ پاسخ از CLI محلی OpenCode دریافت می‌شود', badge: 'Default / Local' },
  { id: 'openrouter', name: 'OpenRouter', type: 'openai-compatible', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', apiKeyEnv: 'OPENROUTER_API_KEY', enabled: false, keyConfigured: false, note: 'اختیاری؛ فقط پس از ثبت secret و فعال‌سازی کاربر', badge: 'Optional Cloud' },
  { id: 'omniroute', name: 'OmniRoute', type: 'openai-compatible', baseUrl: 'http://localhost:20128/v1', model: 'auto', apiKeyEnv: 'OMNIROUTE_API_KEY', enabled: false, keyConfigured: false, note: 'اختیاری؛ فقط پس از ثبت secret و فعال‌سازی کاربر', badge: 'Optional Local' }
];
const gatewayPresets = {
  openrouter: defaultGatewayProfiles.find(profile => profile.id === 'openrouter'),
  omniroute: defaultGatewayProfiles.find(profile => profile.id === 'omniroute'),
  custom: { id: '', name: 'OpenAI-compatible سفارشی', type: 'openai-compatible', baseUrl: '', model: 'auto', apiKeyEnv: 'CUSTOM_PROVIDER_API_KEY', enabled: true, keyConfigured: false, note: 'اتصال سفارشی با قرارداد OpenAI', badge: 'Custom' }
};

const agentList = document.getElementById('agentList');
const timeline = document.getElementById('timeline');
const agentFilter = document.getElementById('agentFilter');
const messageInput = document.getElementById('messageInput');
const toast = document.getElementById('toast');
const gatewayList = document.getElementById('gatewayList');
const gatewayForm = document.getElementById('gatewayForm');
const gatewayCount = document.getElementById('gatewayCount');
let currentView = 'all';
let isPaused = false;
let messageTotal = 0;
let councilHistory = [];
let selectedHistoryRunId = null;
let modelCatalog = [];
const AGENT_MODEL_IDS = ['requirements','architect','backend','security','qa','devops','critic','judge'];
let editingGatewayId = null;
let gatewayProfiles = loadStoredGateways();

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}
function toPersianDigits(value) { return String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]); }
function loadStoredGateways() {
  try {
    const stored = JSON.parse(localStorage.getItem('council-api-gateways') || 'null');
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (error) { console.warn('Saved gateway metadata could not be loaded.', error); }
  return defaultGatewayProfiles.map(profile => ({ ...profile }));
}
function persistGateways() {
  localStorage.setItem('council-api-gateways', JSON.stringify(gatewayProfiles));
}
function renderAgents() {
  agentList.innerHTML = agents.map(agent => `<button class="agent-item ${agent.active ? 'active' : ''}" data-agent="${agent.id}"><span class="agent-avatar ${agent.cls}">${agent.initial}</span><span class="agent-copy"><span class="agent-name">${agent.name}</span><span class="agent-role">${agent.role}</span><span class="status-line ${agent.statusCls}"><i></i>${agent.status}</span></span></button>`).join('');
  agentList.querySelectorAll('.agent-item').forEach(button => button.addEventListener('click', () => { agentFilter.value = button.dataset.agent; renderMessages(); showToast(`نمایش پیام‌های ${button.querySelector('.agent-name').textContent}`); }));
}
function renderMessages() {
  const selected = agentFilter.value;
  const filtered = messages.filter(message => (selected === 'all' || message.agent === selected) && (currentView === 'all' || message.tags.some(tag => tag.type === 'critical')));
  timeline.innerHTML = filtered.length ? filtered.map(message => `<article class="timeline-item" data-id="${message.id}"><div class="timeline-avatar-wrap"><span class="timeline-avatar agent-avatar ${message.cls}">${message.initial}</span></div><div class="message-content"><div class="message-meta"><strong>${message.name}</strong><span class="role-tag">${message.role}</span><span class="message-time">${message.time}</span></div><p class="message-body">${message.body}</p><div class="message-tags">${message.tags.map(tag => `<span class="msg-tag ${tag.type}">${tag.text}</span>`).join('')}</div></div></article>`).join('') : '<div class="empty-state">برای این فیلتر هنوز پیامی ثبت نشده است.</div>';
}
function showToast(text) { toast.textContent = text; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3000); }
function runtimeMessage(agentId, name, role, content, tagText = 'خروجی زنده', tagType = 'reply') {
  const styles = { requirements: 'judge-avatar', architect: 'architect-avatar', backend: 'backend-avatar', security: 'security-avatar', qa: 'qa-avatar', devops: 'devops-avatar', critic: 'critic-avatar', judge: 'judge-avatar' };
  messages.unshift({
    id: Date.now() + Math.random(),
    agent: agentId,
    name,
    role,
    initial: String(name || '?').slice(0, 1),
    cls: styles[agentId] || 'judge-avatar',
    time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    body: escapeHtml(content || '').replace(/\r?\n/g, '<br>'),
    tags: [{ text: tagText, type: tagType }]
  });
  messageTotal += 1;
  document.getElementById('messageCount').textContent = toPersianDigits(messageTotal);
  renderMessages();
}

let activeRunId = null;
let approvalRunId = null;
let isStartingRun = false;

function handleCouncilEvent(event) {
  if (!event || !event.type) return;
  const agent = agents.find(item => item.id === event.agentId);
  if (event.type === 'run_started') {
    activeRunId = event.runId;
    isStartingRun = false;
    for (const item of agents) { item.status = 'آماده'; item.statusCls = ''; item.active = false; }
    renderAgents();
    selectedHistoryRunId = event.runId;
    messages.length = 0;
    messageTotal = 0;
    runtimeMessage('pm', 'درخواست کاربر', 'Council Task', event.prompt || 'درخواست جدید', 'درخواست', 'reply');
    document.querySelector('.verdict-status').textContent = 'در حال بررسی';
    document.querySelector('.decision-name').textContent = 'منتظر حکم قاضی';
    document.querySelector('.confidence strong').textContent = '۰٪';
    document.querySelector('.confidence-track span').style.width = '0%';
    document.querySelector('.live-indicator').textContent = 'جلسه زنده';
    document.querySelector('.session-id strong').textContent = event.runId.slice(0, 8);
    const typing = document.getElementById('typingRow'); if (typing) typing.style.display = 'flex';
    showToast('جلسه چندایجنتی شروع شد.');
    return;
  }
  if (event.type === 'agent_started') {
    if (agent) { agent.status = 'در حال اجرا'; agent.statusCls = 'active-status'; agent.active = true; renderAgents(); }
    return;
  }
  if (event.type === 'agent_completed') {
    if (agent) { agent.status = 'تکمیل شد'; agent.statusCls = 'done-status'; agent.active = false; renderAgents(); }
    runtimeMessage(event.agentId, event.agentName, event.role, event.content, 'نظر مستقل', 'reply');
    return;
  }
  if (event.type === 'agent_failed') {
    if (agent) { agent.status = 'خطا'; agent.statusCls = ''; agent.active = false; renderAgents(); }
    runtimeMessage(event.agentId, event.agentName, event.role, event.error || 'اجرای ایجنت ناموفق بود.', 'خطای اجرا', 'critical');
    return;
  }
  if (event.type === 'critic_started') {
    const critic = agents.find(item => item.id === 'critic'); if (critic) { critic.status = 'در حال نقد'; critic.statusCls = 'active-status'; critic.active = true; renderAgents(); }
    runtimeMessage('critic', 'منتقد مخالف', 'Cross-Critique', 'در حال مقایسه نظرها و جست‌وجوی تناقض‌ها…', 'نقد متقابل', 'critical');
    return;
  }
  if (event.type === 'critic_completed') {
    const critic = agents.find(item => item.id === 'critic'); if (critic) { critic.status = 'تکمیل شد'; critic.statusCls = 'done-status'; critic.active = false; renderAgents(); }
    runtimeMessage('critic', event.agentName, event.role, event.content, 'نقد متقابل', 'critical');
    return;
  }
  if (event.type === 'critic_failed') {
    const critic = agents.find(item => item.id === 'critic'); if (critic) { critic.status = 'خطا'; critic.statusCls = ''; critic.active = false; renderAgents(); }
    runtimeMessage('critic', 'منتقد مخالف', 'Cross-Critique', event.error || 'نقد متقابل ناموفق بود.', 'خطای نقد', 'critical');
    return;
  }
  if (event.type === 'judge_started') {
    const judgeAgent = agents.find(item => item.id === 'judge'); if (judgeAgent) { judgeAgent.status = 'در حال داوری'; judgeAgent.statusCls = 'active-status'; judgeAgent.active = true; renderAgents(); }
    runtimeMessage('judge', 'قاضی نهایی', 'Final Judge', 'در حال ارزیابی شواهد، اختلاف‌ها و ریسک‌ها…', 'قضاوت', '');
    return;
  }
  if (event.type === 'judge_result') {
    const judgeAgent = agents.find(item => item.id === 'judge'); if (judgeAgent) { judgeAgent.status = 'حکم صادر شد'; judgeAgent.statusCls = 'done-status'; judgeAgent.active = false; renderAgents(); }
    const judge = event.judge || {};
    approvalRunId = event.approvalRequired ? event.runId : null;
    document.querySelector('.verdict-status').textContent = judge.decision || 'نامشخص';
    document.querySelector('.confidence-track span').style.width = `${Math.round((judge.confidence || 0) * 100)}%`;
    const reasonsList = document.querySelector('.verdict-section:not(.risk-section) ul');
    const risksList = document.querySelector('.risk-section ul');
    if (reasonsList) reasonsList.innerHTML = (judge.reasons || []).map(item => `<li>${escapeHtml(item)}</li>`).join('') || '<li>دلیلی ثبت نشد.</li>';
    if (risksList) risksList.innerHTML = [...(judge.conditions || []), ...(judge.risks || []).map(item => typeof item === 'string' ? item : `${item.severity || 'ریسک'}: ${item.risk || JSON.stringify(item)}`)].map(item => `<li>${escapeHtml(item)}</li>`).join('') || '<li>ریسکی ثبت نشد.</li>';
    document.querySelector('.next-action strong').textContent = judge.next_action || 'بررسی خروجی شورا';
    document.querySelector('.decision-name').textContent = judge.selected_option || 'نیازمند بررسی بیشتر';
    document.querySelector('.confidence strong').textContent = String(Math.round((judge.confidence || 0) * 100)) + '٪';
    const summary = [
      'تصمیم: ' + (judge.decision || 'نامشخص'),
      'اطمینان: ' + Math.round((judge.confidence || 0) * 100) + '%',
      'دلایل: ' + (Array.isArray(judge.reasons) ? judge.reasons.join('؛ ') : ''),
      'گام بعد: ' + (judge.next_action || '—')
    ].join('\n');
    runtimeMessage('judge', 'قاضی نهایی', 'Final Judge', summary, 'حکم نهایی', event.approvalRequired ? 'critical' : 'reply');
    const approve = document.getElementById('approveBtn');
    const reject = document.getElementById('rejectBtn');
    approve.disabled = !event.approvalRequired;
    reject.disabled = !event.approvalRequired;
    approve.textContent = event.approvalRequired ? 'تأیید تصمیم' : 'نیاز به تأیید انسانی ثبت نشد';
    return;
  }
  if (event.type === 'human_approval_recorded') {
    runtimeMessage('pm', 'مالک پروژه', 'Human Approval', event.approved ? 'تصمیم انسانی ثبت شد؛ این ثبت به‌تنهایی هیچ کد یا عملیات Git را اجرا نمی‌کند.' : 'رد تصمیم انسانی ثبت شد.', 'ثبت تأیید', event.approved ? 'reply' : 'critical');
    approvalRunId = null;
    refreshCouncilHistory(event.runId);
    document.getElementById('approveBtn').disabled = true;
    document.getElementById('rejectBtn').disabled = true;
    return;
  }
  if (event.type === 'run_completed') {
    activeRunId = null;
    isStartingRun = false;
    document.querySelector('.live-indicator').textContent = 'جلسه ذخیره‌شده';
    const typing = document.getElementById('typingRow'); if (typing) typing.style.display = 'none';
    refreshCouncilHistory(event.runId);
    showToast(event.status === 'HUMAN_APPROVAL_REQUIRED' ? 'جلسه تمام شد؛ تصمیم انسانی لازم است.' : 'جلسه تمام شد؛ حکم برای بررسی آماده است.');
    return;
  }
  if (event.type === 'run_cancelled') {
    activeRunId = null;
    isStartingRun = false;
    for (const item of agents) { if (item.active) { item.active = false; item.status = 'متوقف شد'; item.statusCls = ''; } }
    renderAgents();
    document.querySelector('.live-indicator').textContent = 'جلسه لغوشده';
    const typing = document.getElementById('typingRow'); if (typing) typing.style.display = 'none';
    runtimeMessage('pm', 'پرشین', 'Orchestrator', 'اجرای جلسه لغو شد.', 'لغو شد', 'critical');
    refreshCouncilHistory(event.runId);
    return;
  }
  if (event.type === 'run_failed') {
    activeRunId = null;
    isStartingRun = false;
    for (const item of agents) { if (item.active) { item.active = false; item.status = 'متوقف شد'; item.statusCls = ''; } }
    renderAgents();
    document.querySelector('.live-indicator').textContent = 'خطای جلسه';
    const typing = document.getElementById('typingRow'); if (typing) typing.style.display = 'none';
    runtimeMessage('pm', 'پرشین', 'Orchestrator', event.error || 'جلسه ناموفق بود.', 'خطای جلسه', 'critical');
    refreshCouncilHistory(event.runId);
    showToast('اجرای جلسه با خطا متوقف شد.');
  }
}


function readAgentModelSettings() {
  const settings = {};
  for (const id of AGENT_MODEL_IDS) {
    const value = document.getElementById('model-' + id)?.value.trim();
    if (value) settings[id] = value;
  }
  try { localStorage.setItem('council-agent-models', JSON.stringify(settings)); } catch {}
  return settings;
}
function loadAgentModelSettings() {
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem('council-agent-models') || '{}'); } catch {}
  for (const id of AGENT_MODEL_IDS) {
    const input = document.getElementById('model-' + id);
    if (input && typeof settings[id] === 'string') input.value = settings[id];
  }
}
async function loadCouncilModelCatalog() {
  const button = document.getElementById('refreshModelsBtn');
  if (!window.councilCompanion?.listCouncilModels) { showToast('کاتالوگ مدل فقط در نسخه دسکتاپ در دسترس است.'); return; }
  if (button) { button.disabled = true; button.textContent = 'در حال دریافت…'; }
  try {
    const result = await window.councilCompanion.listCouncilModels();
    modelCatalog = Array.isArray(result?.models) ? result.models : [];
    const datalist = document.getElementById('modelCatalog');
    if (datalist) datalist.innerHTML = modelCatalog.map(model => `<option value="${escapeHtml(model)}"></option>`).join('');
    showToast(modelCatalog.length ? `کاتالوگ ${modelCatalog.length} مدل دریافت شد.` : 'مدلی در کاتالوگ OpenCode پیدا نشد.');
  } catch (error) { showToast('دریافت مدل‌ها ناموفق بود: ' + (error.message || 'خطای نامشخص')); }
  finally { if (button) { button.disabled = false; button.textContent = 'به‌روزرسانی مدل‌ها'; } }
}
function historyLabel(session) {
  const date = session.startedAt ? new Date(session.startedAt).toLocaleString('fa-IR') : 'جلسه';
  return `${date} · ${String(session.status || 'نامشخص')}`;
}
function renderHistoryOptions(preferredRunId) {
  const select = document.getElementById('historySelect');
  if (!select) return;
  const current = preferredRunId || select.value || selectedHistoryRunId;
  select.innerHTML = '<option value="">انتخاب جلسه ذخیره‌شده</option>' + councilHistory.map(session => `<option value="${escapeHtml(session.runId)}">${escapeHtml(historyLabel(session))}</option>`).join('');
  if (current && councilHistory.some(session => session.runId === current)) select.value = current;
}
async function refreshCouncilHistory(preferredRunId) {
  if (!window.councilCompanion?.getCouncilHistory) return;
  try { councilHistory = await window.councilCompanion.getCouncilHistory(); renderHistoryOptions(preferredRunId); }
  catch (error) { console.warn('Council history could not be loaded.', error); }
}
function restoreCouncilSession(runId) {
  const session = councilHistory.find(item => item.runId === runId);
  if (!session) return;
  selectedHistoryRunId = runId;
  messages.length = 0;
  messageTotal = 0;
  approvalRunId = null;
  for (const agent of agents) { agent.status = 'آماده'; agent.statusCls = ''; agent.active = false; }
  const events = Array.isArray(session.events) ? session.events : [];
  const approval = events.find(event => event.type === 'human_approval_recorded');
  for (const event of events) {
    if (event.type === 'run_started') runtimeMessage('pm', 'درخواست کاربر', 'Council Task', event.prompt || '', 'درخواست', 'reply');
    if (event.type === 'agent_started') { const agent = agents.find(item => item.id === event.agentId); if (agent) { agent.status = 'در حال اجرا'; agent.statusCls = 'active-status'; agent.active = true; } }
    if (event.type === 'agent_completed') { const agent = agents.find(item => item.id === event.agentId); if (agent) { agent.status = 'تکمیل شد'; agent.statusCls = 'done-status'; agent.active = false; } runtimeMessage(event.agentId, event.agentName, event.role, event.content, 'نظر مستقل', 'reply'); }
    if (event.type === 'agent_failed') { const agent = agents.find(item => item.id === event.agentId); if (agent) { agent.status = 'خطا'; agent.statusCls = ''; agent.active = false; } runtimeMessage(event.agentId, event.agentName, event.role, event.error, 'خطای اجرا', 'critical'); }
    if (event.type === 'critic_started') { const critic = agents.find(item => item.id === 'critic'); if (critic) { critic.status = 'در حال نقد'; critic.statusCls = 'active-status'; critic.active = true; } }
    if (event.type === 'critic_completed') { const critic = agents.find(item => item.id === 'critic'); if (critic) { critic.status = 'تکمیل شد'; critic.statusCls = 'done-status'; critic.active = false; } runtimeMessage('critic', event.agentName, event.role, event.content, 'نقد متقابل', 'critical'); }
    if (event.type === 'critic_failed') { const critic = agents.find(item => item.id === 'critic'); if (critic) { critic.status = 'خطا'; critic.statusCls = ''; critic.active = false; } runtimeMessage('critic', 'منتقد مخالف', 'Cross-Critique', event.error, 'خطای نقد', 'critical'); }
    if (event.type === 'judge_started') { const judgeAgent = agents.find(item => item.id === 'judge'); if (judgeAgent) { judgeAgent.status = 'در حال داوری'; judgeAgent.statusCls = 'active-status'; judgeAgent.active = true; } }
    if (event.type === 'judge_result') {
      const judgeAgent = agents.find(item => item.id === 'judge'); if (judgeAgent) { judgeAgent.status = 'حکم صادر شد'; judgeAgent.statusCls = 'done-status'; judgeAgent.active = false; }
      const judge = event.judge || {};
      approvalRunId = event.approvalRequired && !approval ? runId : null;
      document.querySelector('.verdict-status').textContent = judge.decision || 'نامشخص';
      document.querySelector('.decision-name').textContent = judge.selected_option || 'نیازمند بررسی بیشتر';
      document.querySelector('.confidence strong').textContent = toPersianDigits(Math.round((judge.confidence || 0) * 100)) + '٪';
      document.querySelector('.confidence-track span').style.width = Math.round((judge.confidence || 0) * 100) + '%';
      document.querySelector('.next-action strong').textContent = judge.next_action || 'بررسی خروجی شورا';
      const reasonList = document.querySelector('.verdict-section:not(.risk-section) ul');
      const riskList = document.querySelector('.risk-section ul');
      if (reasonList) reasonList.innerHTML = (judge.reasons || []).map(item => `<li>${escapeHtml(item)}</li>`).join('') || '<li>دلیلی ثبت نشد.</li>';
      if (riskList) riskList.innerHTML = [...(judge.conditions || []), ...(judge.risks || []).map(item => typeof item === 'string' ? item : item.risk || '')].map(item => `<li>${escapeHtml(item)}</li>`).join('') || '<li>ریسکی ثبت نشد.</li>';
      const summary = ['تصمیم: ' + judge.decision, 'دلایل: ' + (judge.reasons || []).join('؛ '), 'شرایط: ' + (judge.conditions || []).join('؛ '), 'ریسک‌ها: ' + (judge.risks || []).map(item => typeof item === 'string' ? item : item.risk).join('؛ '), 'گام بعد: ' + (judge.next_action || '—')].join('\\n');
      runtimeMessage('judge', 'قاضی نهایی', 'Final Judge', summary, 'حکم نهایی', event.approvalRequired ? 'critical' : 'reply');
      document.getElementById('approveBtn').disabled = !approvalRunId;
      document.getElementById('rejectBtn').disabled = !approvalRunId;
    }
    if (event.type === 'human_approval_recorded') runtimeMessage('pm', 'مالک پروژه', 'Human Approval', event.approved ? 'تأیید انسانی ثبت شد.' : 'رد انسانی ثبت شد.', 'تصمیم انسانی', event.approved ? 'reply' : 'critical');
    if (event.type === 'run_failed') runtimeMessage('pm', 'پرشین', 'Orchestrator', event.error, 'خطای جلسه', 'critical');
    if (event.type === 'run_cancelled') runtimeMessage('pm', 'پرشین', 'Orchestrator', 'جلسه لغو شد.', 'لغو شد', 'critical');
  }
  renderAgents();
  renderMessages();
  document.getElementById('messageCount').textContent = toPersianDigits(messageTotal);
  document.querySelector('.session-id strong').textContent = runId.slice(0, 8);
  const isRunning = session.status === 'RUNNING';
  activeRunId = isRunning ? runId : null;
  document.getElementById('typingRow').style.display = isRunning ? 'flex' : 'none';
  document.querySelector('.live-indicator').textContent = isRunning ? 'جلسه زنده' : session.status === 'INTERRUPTED' ? 'جلسه ناتمام' : 'جلسه ذخیره‌شده';
}

async function askOpenCode(prompt) {
  if (!window.councilCompanion?.isDesktop || typeof window.councilCompanion.startCouncilRun !== 'function') {
    showToast('برای اجرای شورای واقعی، نسخه دسکتاپ Council Room را باز کنید.');
    return;
  }
  if (activeRunId || isStartingRun) {
    showToast('یک جلسه در حال اجرا است. ابتدا آن را لغو کنید.');
    return;
  }
  try {
    isStartingRun = true;
    const result = await window.councilCompanion.startCouncilRun(prompt, { model: document.getElementById('sessionModel')?.value.trim() || undefined, agentModels: readAgentModelSettings() });
    isStartingRun = false;
    selectedHistoryRunId = result.runId;
    showToast('درخواست به ایجنت‌های مستقل ارسال شد.');
  } catch (error) {
    isStartingRun = false;
    runtimeMessage('pm', 'پرشین', 'Orchestrator', error.message || 'شروع جلسه ناموفق بود.', 'خطای شروع', 'critical');
  }
}

async function recordHumanApproval(approved) {
  if (!approvalRunId || !window.councilCompanion?.recordCouncilApproval) {
    showToast('در حال حاضر تأیید انسانی در انتظار ثبت نیست.');
    return;
  }
  try {
    await window.councilCompanion.recordCouncilApproval(approvalRunId, approved, 'تصمیم ثبت‌شده در رابط Council Room');
    showToast('تصمیم انسانی ثبت شد. هیچ عملیات اجرایی یا Git انجام نشد.');
  } catch (error) {
    showToast('ثبت تصمیم انجام نشد: ' + (error.message || 'خطای نامشخص'));
  }
}
function addMessage() {
  const value = messageInput.value.trim();
  if (!value) { showToast('اول یک پیام یا دستور برای اتاق بنویسید.'); messageInput.focus(); return; }
  messageInput.value = ''; messageInput.style.height = 'auto';
  agentFilter.value = 'all'; currentView = 'all'; document.querySelectorAll('.view-toggle').forEach(button => button.classList.toggle('active', button.dataset.view === 'all'));
  askOpenCode(value).catch(error => showToast(`خطای اجرای OpenCode: ${error.message || 'unknown_error'}`));
}
function gatewayStatus(profile) {
  if (profile.type === 'local-cli') return { label: profile.enabled ? 'پیش‌فرض' : 'غیرفعال', cls: profile.enabled ? 'gateway-ready' : 'gateway-neutral' };
  if (!profile.baseUrl || !profile.model || !profile.apiKeyEnv) return { label: 'ناقص', cls: 'gateway-warning' };
  if (!profile.keyConfigured) return { label: 'اتصال تنظیم نشده', cls: 'gateway-neutral' };
  return { label: 'اتصال تأیید نشده', cls: 'gateway-warning' };
}
function renderGatewayPresetOptions() {
  const select = document.getElementById('gatewayPreset');
  if (!select) return;
  const current = select.value;
  select.innerHTML = gatewayProfiles.map(profile => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.name)}</option>`).join('') + '<option value="custom">OpenAI-compatible سفارشی</option>';
  select.value = gatewayProfiles.some(profile => profile.id === current) || current === 'custom' ? current : 'custom';
}
function renderGateways() {
  gatewayCount.textContent = toPersianDigits(gatewayProfiles.length);
  renderGatewayPresetOptions();
  gatewayList.innerHTML = gatewayProfiles.map(profile => {
    const status = gatewayStatus(profile);
    return `<article class="gateway-item ${profile.enabled ? '' : 'is-disabled'}" data-gateway-id="${escapeHtml(profile.id)}"><div class="gateway-item-head"><div class="gateway-logo ${profile.id === 'openrouter' ? 'openrouter-logo' : profile.id === 'omniroute' ? 'omniroute-logo' : 'custom-logo'}">${profile.id === 'openrouter' ? 'O' : profile.id === 'omniroute' ? 'Ω' : '↗'}</div><div class="gateway-title"><strong>${escapeHtml(profile.name)}</strong><span>${escapeHtml(profile.badge || 'OpenAI-compatible')}</span></div><span class="gateway-status ${status.cls}"><i></i>${status.label}</span></div><div class="gateway-details"><code>${escapeHtml(profile.baseUrl || 'Base URL وارد نشده')}</code><span class="gateway-model">model: ${escapeHtml(profile.model || '—')}</span></div><div class="gateway-item-footer"><span class="gateway-secret"><i></i>${escapeHtml(profile.apiKeyEnv || 'SECRET_ENV تنظیم نشده')}</span><button class="gateway-edit" data-edit-gateway="${escapeHtml(profile.id)}">ویرایش</button></div></article>`;
  }).join('');
  gatewayList.querySelectorAll('[data-edit-gateway]').forEach(button => button.addEventListener('click', () => openGatewayForm(button.dataset.editGateway)));
}
function applyPreset(presetId) {
  const preset = gatewayProfiles.find(profile => profile.id === presetId) || gatewayPresets[presetId] || gatewayPresets.custom;
  document.getElementById('gatewayName').value = preset.name;
  document.getElementById('gatewayBaseUrl').value = preset.baseUrl;
  document.getElementById('gatewayModel').value = preset.model;
  document.getElementById('gatewayKeyEnv').value = preset.apiKeyEnv;
}
function openGatewayForm(id = null) {
  editingGatewayId = id;
  const profile = id ? gatewayProfiles.find(item => item.id === id) : gatewayPresets.custom;
  if (!profile) return;
  document.getElementById('gatewayFormTitle').textContent = id ? `ویرایش ${profile.name}` : 'افزودن درگاه';
  document.getElementById('gatewayPreset').value = id && gatewayProfiles.some(profile => profile.id === id) ? id : 'custom';
  document.getElementById('gatewayName').value = profile.name;
  document.getElementById('gatewayBaseUrl').value = profile.baseUrl;
  document.getElementById('gatewayModel').value = profile.model;
  document.getElementById('gatewayKeyEnv').value = profile.apiKeyEnv;
  document.getElementById('gatewayKeyInput').value = '';
  gatewayForm.hidden = false;
  gatewayForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('gatewayName').focus();
}
function closeGatewayForm() { editingGatewayId = null; gatewayForm.hidden = true; }
function validateGatewayForm(showMessage = true) {
  const baseUrl = document.getElementById('gatewayBaseUrl').value.trim();
  const model = document.getElementById('gatewayModel').value.trim();
  const apiKeyEnv = document.getElementById('gatewayKeyEnv').value.trim();
  const envPattern = /^[A-Z][A-Z0-9_]{1,127}$/;
  const urlOk = /^https?:\/\/[^\s]+$/i.test(baseUrl);
  const envOk = envPattern.test(apiKeyEnv);
  if (!urlOk || !model || !envOk) {
    if (showMessage) showToast('Base URL، مدل و نام secret را کامل و معتبر وارد کنید.');
    return false;
  }
  if (showMessage) showToast('ساختار تنظیمات معتبر است؛ اتصال واقعی Gateway هنوز پیاده‌سازی نشده است.');
  return true;
}
function saveGateway() {
  if (!validateGatewayForm(false)) { showToast('Base URL، مدل و نام secret را کامل و معتبر وارد کنید.'); return; }
  const previous = editingGatewayId ? gatewayProfiles.find(item => item.id === editingGatewayId) : null;
  const name = document.getElementById('gatewayName').value.trim() || 'درگاه سفارشی';
  const profile = { id: editingGatewayId || `custom-${Date.now()}`, name, type: 'openai-compatible', baseUrl: document.getElementById('gatewayBaseUrl').value.trim(), model: document.getElementById('gatewayModel').value.trim(), apiKeyEnv: document.getElementById('gatewayKeyEnv').value.trim(), enabled: previous?.enabled ?? true, keyConfigured: false, note: 'تنظیمات ذخیره شده است؛ اتصال و ذخیره امن Secret هنوز پیاده‌سازی نشده است.', badge: previous?.badge || 'Custom' };
  if (editingGatewayId) gatewayProfiles = gatewayProfiles.map(item => item.id === editingGatewayId ? profile : item); else gatewayProfiles.push(profile);
  persistGateways(); renderGateways(); closeGatewayForm(); showToast(`تنظیمات «${name}» ذخیره شد؛ Secret ذخیره نشد و اتصال فعال نیست.`);
}
function exportGateways() {
  const safeConfig = { version: 1, default: gatewayProfiles[0]?.id || null, profiles: gatewayProfiles.map(({ keyConfigured, ...profile }) => ({ ...profile, secret: `<env:${profile.apiKeyEnv}>` })) };
  const blob = new Blob([JSON.stringify(safeConfig, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'council-api-gateways.json'; link.click(); URL.revokeObjectURL(url); showToast('JSON امن دانلود شد؛ مقدار کلید داخل فایل نیست.');
}
async function loadProjectGateways() {
  try {
    const response = window.councilCompanion?.loadProjectConfig
      ? { ok: true, json: () => window.councilCompanion.loadProjectConfig() }
      : await fetch('./config/council.config.json', { cache: 'no-store' });
    if (!response.ok) return;
    const config = await response.json();
    if (Array.isArray(config.apiGateways?.profiles) && config.apiGateways.profiles.length) {
      const stored = JSON.parse(localStorage.getItem('council-api-gateways') || '[]');
      const storedById = new Map(stored.map(profile => [profile.id, profile]));
      const configuredIds = new Set(config.apiGateways.profiles.map(profile => profile.id));
      gatewayProfiles = config.apiGateways.profiles.map(profile => ({ ...profile, ...(storedById.get(profile.id) || {}), keyConfigured: Boolean(storedById.get(profile.id)?.keyConfigured), badge: profile.badge || (profile.id === 'openrouter' ? 'Cloud Router' : profile.id === 'omniroute' ? 'Local Router' : profile.type === 'native-rest' ? 'Native REST' : 'OpenAI-compatible') })).concat(stored.filter(profile => !configuredIds.has(profile.id)));
      renderGateways();
    }
  } catch (error) { console.warn('Project gateway config could not be loaded.', error); }
}

agentFilter.addEventListener('change', renderMessages);
document.querySelectorAll('.view-toggle').forEach(button => button.addEventListener('click', () => { currentView = button.dataset.view; document.querySelectorAll('.view-toggle').forEach(item => item.classList.toggle('active', item === button)); renderMessages(); }));
document.getElementById('sendBtn').addEventListener('click', addMessage);
messageInput.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); addMessage(); } });
messageInput.addEventListener('input', () => { messageInput.style.height = 'auto'; messageInput.style.height = `${Math.min(messageInput.scrollHeight, 100)}px`; });
document.getElementById('pauseBtn').addEventListener('click', async () => { if (!activeRunId) { showToast('جلسه فعالی برای لغو وجود ندارد.'); return; } const result = await window.councilCompanion?.cancelCouncilRun?.(activeRunId); showToast(result?.ok ? 'درخواست لغو برای همه ایجنت‌ها ارسال شد.' : 'لغو جلسه ممکن نشد.'); });
document.getElementById('approveBtn').addEventListener('click', () => recordHumanApproval(true));
document.getElementById('rejectBtn').addEventListener('click', () => recordHumanApproval(false));

document.getElementById('detailsBtn').addEventListener('click', () => { const item = messages.find(message => message.agent === 'judge'); const node = item && timeline.querySelector(`[data-id="${item.id}"]`); if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' }); else showToast('هنوز حکم قاضی در این جلسه ثبت نشده است.'); });
document.getElementById('addGatewayBtn').addEventListener('click', () => openGatewayForm());
document.getElementById('cancelGatewayBtn').addEventListener('click', closeGatewayForm);
document.getElementById('gatewayPreset').addEventListener('change', event => { if (!editingGatewayId || event.target.value === 'custom') applyPreset(event.target.value); });
document.getElementById('checkGatewayBtn').addEventListener('click', () => validateGatewayForm(true));
document.getElementById('saveGatewayBtn').addEventListener('click', saveGateway);
document.getElementById('exportGatewayBtn').addEventListener('click', exportGateways);

const motionStudioModal = document.getElementById('motionStudioModal');
const motionStudioStatus = document.getElementById('motionStudioStatus');
const motionStudioWorkspace = document.getElementById('motionStudioWorkspace');
const motionToolSelect = document.getElementById('motionToolSelect');
const motionToolDescription = document.getElementById('motionToolDescription');
const motionToolSchema = document.getElementById('motionToolSchema');
const motionToolArgs = document.getElementById('motionToolArgs');
const motionToolResult = document.getElementById('motionToolResult');
const runMotionToolBtn = document.getElementById('runMotionToolBtn');
let concatTools = [];

function openMotionStudio() {
  motionStudioModal?.classList.add('open');
  motionStudioModal?.setAttribute('aria-hidden', 'false');
}
function closeMotionStudio() {
  motionStudioModal?.classList.remove('open');
  motionStudioModal?.setAttribute('aria-hidden', 'true');
}
function renderConcatTools(tools) {
  concatTools = Array.isArray(tools) ? tools : [];
  motionToolSelect.innerHTML = '<option value="">ابزار را انتخاب کنید</option>' +
    concatTools.map(tool => `<option value="${escapeHtml(tool.name)}">${escapeHtml(tool.name)} — ${tool.access === 'write' ? 'تغییر' : 'خواندن'}</option>`).join('');
  motionStudioWorkspace.hidden = false;
  motionStudioStatus.textContent = `اتصال برقرار است؛ ${toPersianDigits(concatTools.length)} ابزار مجاز شناسایی شد.`;
}
document.getElementById('motionStudioBtn')?.addEventListener('click', openMotionStudio);
document.getElementById('closeMotionStudio')?.addEventListener('click', closeMotionStudio);
motionStudioModal?.addEventListener('click', event => { if (event.target === motionStudioModal) closeMotionStudio(); });
document.getElementById('connectConcatBtn')?.addEventListener('click', async () => {
  const button = document.getElementById('connectConcatBtn');
  button.disabled = true;
  motionStudioStatus.textContent = 'در حال اتصال به Concat…';
  try {
    const status = await window.councilCompanion?.connectConcat?.();
    if (!status?.ok) throw new Error('concat_connection_failed');
    renderConcatTools(status.tools);
    motionToolResult.textContent = JSON.stringify({ server: status.serverInfo, version: status.version }, null, 2);
    showToast('اتصال Motion Studio برقرار شد.');
  } catch (error) {
    motionStudioStatus.textContent = `اتصال برقرار نشد: ${error.message || 'خطای ناشناخته'}`;
    showToast('اتصال Concat ناموفق بود. تنظیم Automation را بررسی کن.');
  } finally { button.disabled = false; }
});
motionToolSelect?.addEventListener('change', () => {
  const tool = concatTools.find(item => item.name === motionToolSelect.value);
  motionToolDescription.textContent = tool?.description || '';
  motionToolSchema.textContent = tool ? JSON.stringify(tool.inputSchema, null, 2) : '';
  motionToolArgs.value = '{}';
  runMotionToolBtn.disabled = !tool;
});
runMotionToolBtn?.addEventListener('click', async () => {
  const name = motionToolSelect.value;
  if (!name) return;
  let args;
  try { args = JSON.parse(motionToolArgs.value || '{}'); }
  catch { showToast('ورودی JSON معتبر نیست.'); return; }
  runMotionToolBtn.disabled = true;
  motionToolResult.textContent = 'در حال اجرا…';
  try {
    const response = await window.councilCompanion.callConcatTool(name, args);
    motionToolResult.textContent = JSON.stringify(response, null, 2);
    if (response.cancelled) showToast('عملیات لغو شد.');
    else showToast('ابزار Concat اجرا شد.');
  } catch (error) {
    motionToolResult.textContent = error.message || 'concat_tool_failed';
    showToast('اجرای ابزار Concat ناموفق بود.');
  } finally { runMotionToolBtn.disabled = false; }
});
document.getElementById('disconnectConcatBtn')?.addEventListener('click', async () => {
  try { await window.councilCompanion?.disconnectConcat?.(); } catch {}
  concatTools = [];
  motionStudioWorkspace.hidden = true;
  motionToolSelect.innerHTML = '<option value="">ابزار را انتخاب کنید</option>';
  motionStudioStatus.textContent = 'اتصال قطع شد.';
  motionToolResult.textContent = 'هنوز دستوری اجرا نشده است.';
});

renderAgents(); renderMessages(); renderGateways(); loadProjectGateways();
loadAgentModelSettings();
document.getElementById('refreshModelsBtn')?.addEventListener('click', loadCouncilModelCatalog);
document.querySelectorAll('[data-agent-model]').forEach(input => input.addEventListener('change', readAgentModelSettings));
document.getElementById('sessionModel')?.addEventListener('change', () => { try { localStorage.setItem('council-session-model', document.getElementById('sessionModel').value.trim()); } catch {} });
try { document.getElementById('sessionModel').value = localStorage.getItem('council-session-model') || ''; } catch {}
document.getElementById('historySelect')?.addEventListener('change', event => restoreCouncilSession(event.target.value));
refreshCouncilHistory().then(() => { const latest = councilHistory[0]; if (latest) { renderHistoryOptions(latest.runId); restoreCouncilSession(latest.runId); } });
if (window.councilCompanion?.onCouncilEvent) window.councilCompanion.onCouncilEvent(handleCouncilEvent);
document.getElementById('messageCount').textContent = toPersianDigits(messageTotal);
let seconds = 0;
setInterval(() => { seconds += 1; const h = String(Math.floor(seconds / 3600)).padStart(2, '۰'); const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '۰'); const s = String(seconds % 60).padStart(2, '۰'); document.getElementById('elapsed').textContent = `${h}:${m}:${s}`; }, 1000);
