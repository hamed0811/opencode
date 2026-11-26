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
const messages = [
  { id: 1, agent: 'pm', name: 'پرشین', role: 'مغز متفکر · Orchestrator', initial: 'پ', cls: 'judge-avatar', time: 'نمونه', body: 'درخواست دریافت شد: برای مخزن <em>opencode</em> یک runtime بسازیم که وظایف برنامه‌نویسی را به ایجنت‌ها بسپارد، خروجی را در اتاق ثبت کند و در پایان Pull Request پیشنهاد دهد.', tags: [{ text: 'درخواست اصلی', type: '' }] },
  { id: 2, agent: 'architect', name: 'معمار نرم‌افزار', role: 'معماری runtime', initial: 'م', cls: 'architect-avatar', time: 'نمونه', body: 'پیشنهاد من <em>Modular Agent Runtime</em> است: Orchestrator، Message Bus، Tool Runner و Event Store جدا باشند؛ اما برای فاز صفر در یک repository و با interfaceهای مستقل شروع کنیم.', tags: [{ text: 'پیشنهاد معماری', type: '' }] },
  { id: 3, agent: 'security', name: 'متخصص امنیت', role: 'Sandbox و Secretها', initial: 'ا', cls: 'security-avatar', time: 'نمونه', body: 'موافقم، مشروط به اینکه اجرای shell و Git در sandbox انجام شود. <span class="highlight">توکن GitHub و کلید OpenAI نباید وارد پیام ایجنت‌ها، لاگ یا Pull Request شوند.</span>', tags: [{ text: 'ریسک بالا', type: 'critical' }, { text: 'در پاسخ به معمار', type: 'reply' }] },
  { id: 4, agent: 'backend', name: 'متخصص بک‌اند', role: 'Tool API و اجرا', initial: 'ب', cls: 'backend-avatar', time: 'نمونه', body: 'برای هر اجرا یک <em>run_id</em> و برای هر پیام یک event_id تولید می‌کنیم. Tool Runner فقط allowlist ابزارها را قبول می‌کند و نتیجه را ساختاریافته به Orchestrator برمی‌گرداند.', tags: [{ text: 'قابل اجرا', type: '' }] },
  { id: 5, agent: 'critic', name: 'منتقد مخالف', role: 'پیدا کردن ریسک‌ها', initial: 'ن', cls: 'critic-avatar', time: 'نمونه', body: 'اگر Orchestrator بتواند مستقیماً branch اصلی را تغییر دهد، یک تصمیم اشتباه می‌تواند کد را خراب کند. پیشنهاد می‌کنم PR اجباری باشد و merge همیشه بعد از تأیید انسانی بماند.', tags: [{ text: 'چالش باز', type: 'critical' }] },
  { id: 6, agent: 'qa', name: 'متخصص تست', role: 'کیفیت و CI', initial: 'ت', cls: 'qa-avatar', time: 'نمونه', body: 'حداقل تست فاز صفر: unit برای router، integration برای Message Bus، تست permission برای Tool Runner و یک سناریوی end-to-end که از درخواست تا draft PR را طی کند.', tags: [{ text: 'سناریوی تست', type: '' }] },
  { id: 7, agent: 'devops', name: 'متخصص DevOps', role: 'Branch و Pull Request', initial: 'د', cls: 'devops-avatar', time: 'نمونه', body: 'workflow باید روی branch با نام <em>agent/opencode-bootstrap</em> اجرا شود. CI بعد از push، lint و test را اجرا می‌کند و فقط در صورت سبز بودن، PR draft ساخته می‌شود.', tags: [{ text: 'GitHub flow', type: '' }] },
  { id: 8, agent: 'security', name: 'متخصص امنیت', role: 'Sandbox و Secretها', initial: 'ا', cls: 'security-avatar', time: 'نمونه', body: 'یک شرط دیگر: ابزارها باید با policy صریح فراخوانی شوند؛ دسترسی شبکه پیش‌فرض خاموش باشد و هر درخواست خارج از policy به تأیید انسانی برگردد.', tags: [{ text: 'شرط اجرا', type: 'critical' }] }
];

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
let messageTotal = messages.length;
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

function handleCouncilEvent(event) {
  if (!event || !event.type) return;
  const agent = agents.find(item => item.id === event.agentId);
  if (event.type === 'run_started') {
    activeRunId = event.runId;
    document.querySelector('.live-indicator').textContent = 'جلسه زنده';
    document.querySelector('.session-id strong').textContent = event.runId.slice(0, 8);
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
    runtimeMessage('critic', 'منتقد مخالف', 'Cross-Critique', 'در حال مقایسه نظرها و جست‌وجوی تناقض‌ها…', 'نقد متقابل', 'critical');
    return;
  }
  if (event.type === 'critic_completed') {
    runtimeMessage('critic', event.agentName, event.role, event.content, 'نقد متقابل', 'critical');
    return;
  }
  if (event.type === 'critic_failed') {
    runtimeMessage('critic', 'منتقد مخالف', 'Cross-Critique', event.error || 'نقد متقابل ناموفق بود.', 'خطای نقد', 'critical');
    return;
  }
  if (event.type === 'judge_started') {
    runtimeMessage('judge', 'قاضی نهایی', 'Final Judge', 'در حال ارزیابی شواهد، اختلاف‌ها و ریسک‌ها…', 'قضاوت', '');
    return;
  }
  if (event.type === 'judge_result') {
    const judge = event.judge || {};
    approvalRunId = event.approvalRequired ? event.runId : null;
    document.querySelector('.verdict-status').textContent = judge.decision || 'نامشخص';
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
    approve.disabled = !event.approvalRequired;
    approve.textContent = event.approvalRequired ? 'ثبت تصمیم انسانی' : 'نیاز به تأیید انسانی ثبت نشد';
    return;
  }
  if (event.type === 'human_approval_recorded') {
    runtimeMessage('pm', 'مالک پروژه', 'Human Approval', event.approved ? 'تصمیم انسانی ثبت شد؛ این ثبت به‌تنهایی هیچ کد یا عملیات Git را اجرا نمی‌کند.' : 'رد تصمیم انسانی ثبت شد.', 'ثبت تأیید', event.approved ? 'reply' : 'critical');
    approvalRunId = null;
    return;
  }
  if (event.type === 'run_completed') {
    activeRunId = null;
    showToast(event.status === 'HUMAN_APPROVAL_REQUIRED' ? 'جلسه تمام شد؛ تصمیم انسانی لازم است.' : 'جلسه تمام شد؛ حکم برای بررسی آماده است.');
    return;
  }
  if (event.type === 'run_cancelled') {
    activeRunId = null;
    runtimeMessage('pm', 'پرشین', 'Orchestrator', 'اجرای جلسه لغو شد.', 'لغو شد', 'critical');
    return;
  }
  if (event.type === 'run_failed') {
    activeRunId = null;
    runtimeMessage('pm', 'پرشین', 'Orchestrator', event.error || 'جلسه ناموفق بود.', 'خطای جلسه', 'critical');
    showToast('اجرای جلسه با خطا متوقف شد.');
  }
}

async function askOpenCode(prompt) {
  if (!window.councilCompanion?.isDesktop || typeof window.councilCompanion.startCouncilRun !== 'function') {
    showToast('برای اجرای شورای واقعی، نسخه دسکتاپ Council Room را باز کنید.');
    return;
  }
  if (activeRunId) {
    showToast('یک جلسه در حال اجرا است. ابتدا آن را لغو کنید.');
    return;
  }
  try {
    const result = await window.councilCompanion.startCouncilRun(prompt);
    activeRunId = result.runId;
    showToast('درخواست به ایجنت‌های مستقل ارسال شد.');
  } catch (error) {
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
  messages.unshift({ id: Date.now(), agent: 'pm', name: 'شما · مالک پروژه', role: 'دستور به پرشین', initial: 'ح', cls: 'judge-avatar', time: 'نمونه', body: escapeHtml(value), tags: [{ text: 'دستور جدید', type: 'reply' }] });
  agentFilter.value = 'all'; currentView = 'all'; document.querySelectorAll('.view-toggle').forEach(button => button.classList.toggle('active', button.dataset.view === 'all')); renderMessages(); messageInput.value = ''; messageInput.style.height = 'auto'; messageTotal += 1; document.getElementById('messageCount').textContent = toPersianDigits(messageTotal); showToast('دستور شما به اتاق مشورت ارسال شد.');
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
document.getElementById('approvalBtn').addEventListener('click', () => { showToast('این کارت نمونه است. هیچ تأییدی ثبت نشد.'); });
document.querySelector('.decline-small').addEventListener('click', () => showToast('این کارت نمونه است. هیچ درخواستی رد یا تغییر داده نشد.'));
document.getElementById('detailsBtn').addEventListener('click', () => showToast('این بخش فقط به سند نمونه اشاره می‌کند؛ حکم زنده‌ای برای نمایش وجود ندارد.'));
document.getElementById('addGatewayBtn').addEventListener('click', () => openGatewayForm());
document.getElementById('cancelGatewayBtn').addEventListener('click', closeGatewayForm);
document.getElementById('gatewayPreset').addEventListener('change', event => { if (!editingGatewayId || event.target.value === 'custom') applyPreset(event.target.value); });
document.getElementById('checkGatewayBtn').addEventListener('click', () => validateGatewayForm(true));
document.getElementById('saveGatewayBtn').addEventListener('click', saveGateway);
document.getElementById('exportGatewayBtn').addEventListener('click', exportGateways);

renderAgents(); renderMessages(); renderGateways(); loadProjectGateways();
if (window.councilCompanion?.onCouncilEvent) window.councilCompanion.onCouncilEvent(handleCouncilEvent);
document.getElementById('messageCount').textContent = toPersianDigits(messageTotal);
let seconds = 0;
setInterval(() => { seconds += 1; const h = String(Math.floor(seconds / 3600)).padStart(2, '۰'); const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '۰'); const s = String(seconds % 60).padStart(2, '۰'); document.getElementById('elapsed').textContent = `${h}:${m}:${s}`; }, 1000);
