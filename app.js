const agents = [
  { id: 'pm', name: 'پرشین', role: 'مغز متفکر · Orchestrator', initial: 'پ', cls: 'judge-avatar', status: 'در حال هماهنگی', statusCls: 'active-status', active: false },
  { id: 'architect', name: 'معمار نرم‌افزار', role: 'معماری runtime', initial: 'م', cls: 'architect-avatar', status: 'در حال بررسی', statusCls: 'active-status', active: true },
  { id: 'backend', name: 'متخصص بک‌اند', role: 'Tool API و اجرا', initial: 'ب', cls: 'backend-avatar', status: 'تکمیل‌شده', statusCls: 'done-status' },
  { id: 'frontend', name: 'متخصص فرانت‌اند', role: 'داشبورد و UX', initial: 'ف', cls: 'frontend-avatar', status: 'منتظر', statusCls: '' },
  { id: 'db', name: 'متخصص دیتابیس', role: 'State و event log', initial: 'د', cls: 'db-avatar', status: 'تکمیل‌شده', statusCls: 'done-status' },
  { id: 'security', name: 'متخصص امنیت', role: 'Sandbox و Secretها', initial: 'ا', cls: 'security-avatar', status: 'در حال بررسی', statusCls: 'active-status' },
  { id: 'qa', name: 'متخصص تست', role: 'کیفیت و CI', initial: 'ت', cls: 'qa-avatar', status: 'منتظر', statusCls: '' },
  { id: 'devops', name: 'متخصص DevOps', role: 'Branch و Pull Request', initial: 'د', cls: 'devops-avatar', status: 'تکمیل‌شده', statusCls: 'done-status' },
  { id: 'critic', name: 'منتقد مخالف', role: 'پیدا کردن ریسک‌ها', initial: 'ن', cls: 'critic-avatar', status: 'در حال نقد', statusCls: 'active-status' }
];
const messages = [
  { id: 1, agent: 'pm', name: 'پرشین', role: 'مغز متفکر · Orchestrator', initial: 'پ', cls: 'judge-avatar', time: 'همین الان', body: 'درخواست دریافت شد: برای مخزن <em>opencode</em> یک runtime بسازیم که وظایف برنامه‌نویسی را به ایجنت‌ها بسپارد، خروجی را در اتاق ثبت کند و در پایان Pull Request پیشنهاد دهد.', tags: [{ text: 'درخواست اصلی', type: '' }] },
  { id: 2, agent: 'architect', name: 'معمار نرم‌افزار', role: 'معماری runtime', initial: 'م', cls: 'architect-avatar', time: '۱ دقیقه پیش', body: 'پیشنهاد من <em>Modular Agent Runtime</em> است: Orchestrator، Message Bus، Tool Runner و Event Store جدا باشند؛ اما برای فاز صفر در یک repository و با interfaceهای مستقل شروع کنیم.', tags: [{ text: 'پیشنهاد معماری', type: '' }] },
  { id: 3, agent: 'security', name: 'متخصص امنیت', role: 'Sandbox و Secretها', initial: 'ا', cls: 'security-avatar', time: '۲ دقیقه پیش', body: 'موافقم، مشروط به اینکه اجرای shell و Git در sandbox انجام شود. <span class="highlight">توکن GitHub و کلید OpenAI نباید وارد پیام ایجنت‌ها، لاگ یا Pull Request شوند.</span>', tags: [{ text: 'ریسک بالا', type: 'critical' }, { text: 'در پاسخ به معمار', type: 'reply' }] },
  { id: 4, agent: 'backend', name: 'متخصص بک‌اند', role: 'Tool API و اجرا', initial: 'ب', cls: 'backend-avatar', time: '۳ دقیقه پیش', body: 'برای هر اجرا یک <em>run_id</em> و برای هر پیام یک event_id تولید می‌کنیم. Tool Runner فقط allowlist ابزارها را قبول می‌کند و نتیجه را ساختاریافته به Orchestrator برمی‌گرداند.', tags: [{ text: 'قابل اجرا', type: '' }] },
  { id: 5, agent: 'critic', name: 'منتقد مخالف', role: 'پیدا کردن ریسک‌ها', initial: 'ن', cls: 'critic-avatar', time: '۴ دقیقه پیش', body: 'اگر Orchestrator بتواند مستقیماً branch اصلی را تغییر دهد، یک تصمیم اشتباه می‌تواند کد را خراب کند. پیشنهاد می‌کنم PR اجباری باشد و merge همیشه بعد از تأیید انسانی بماند.', tags: [{ text: 'چالش باز', type: 'critical' }] },
  { id: 6, agent: 'qa', name: 'متخصص تست', role: 'کیفیت و CI', initial: 'ت', cls: 'qa-avatar', time: '۶ دقیقه پیش', body: 'حداقل تست فاز صفر: unit برای router، integration برای Message Bus، تست permission برای Tool Runner و یک سناریوی end-to-end که از درخواست تا draft PR را طی کند.', tags: [{ text: 'سناریوی تست', type: '' }] },
  { id: 7, agent: 'devops', name: 'متخصص DevOps', role: 'Branch و Pull Request', initial: 'د', cls: 'devops-avatar', time: '۷ دقیقه پیش', body: 'workflow باید روی branch با نام <em>agent/opencode-bootstrap</em> اجرا شود. CI بعد از push، lint و test را اجرا می‌کند و فقط در صورت سبز بودن، PR draft ساخته می‌شود.', tags: [{ text: 'GitHub flow', type: '' }] },
  { id: 8, agent: 'security', name: 'متخصص امنیت', role: 'Sandbox و Secretها', initial: 'ا', cls: 'security-avatar', time: '۸ دقیقه پیش', body: 'یک شرط دیگر: ابزارها باید با policy صریح فراخوانی شوند؛ دسترسی شبکه پیش‌فرض خاموش باشد و هر درخواست خارج از policy به تأیید انسانی برگردد.', tags: [{ text: 'شرط اجرا', type: 'critical' }] }
];

const defaultGatewayProfiles = [
  { id: 'opencode-local', name: 'OpenCode محلی', type: 'local-cli', command: 'opencode', model: 'کاتالوگ OpenCode', freeModelsOnly: true, enabled: true, keyConfigured: true, note: 'درگاه پیش‌فرض؛ پاسخ از CLI محلی OpenCode دریافت می‌شود', badge: 'Default / Local' },
  { id: 'openrouter', name: 'OpenRouter', type: 'openai-compatible', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', apiKeyEnv: 'OPENROUTER_API_KEY', enabled: false, keyConfigured: false, note: 'اختیاری؛ فقط پس از ثبت secret و فعال‌سازی کاربر', badge: 'Optional Cloud' },
  { id: 'omniroute', name: 'OmniRoute', type: 'openai-compatible', baseUrl: 'http://localhost:20128/v1', model: 'auto', apiKeyEnv: 'OMNIROUTE_API_KEY', enabled: false, keyConfigured: false, note: 'اختیاری؛ فقط پس از ثبت secret و فعال‌سازی کاربر', badge: 'Optional Local' }
];
const gatewayPresets = {
  openrouter: defaultGatewayProfiles[0],
  omniroute: defaultGatewayProfiles[1],
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
let messageTotal = 31;
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
async function askOpenCode(prompt) {
  if (!window.councilCompanion?.isDesktop || typeof window.councilCompanion.runOpenCodePrompt !== 'function') {
    showToast('برای پاسخ واقعی OpenCode، نسخه دسکتاپ و OpenCode Companion را اجرا کنید.');
    return;
  }
  showToast('پرشین در حال دریافت پاسخ از OpenCode محلی است…');
  const response = await window.councilCompanion.runOpenCodePrompt(prompt);
  if (!response?.ok) {
    const errorText = response?.error || 'opencode_unavailable';
    messages.unshift({ id: Date.now() + 1, agent: 'pm', name: 'پرشین', role: 'OpenCode محلی', initial: 'پ', cls: 'judge-avatar', time: 'همین الان', body: `وضعیت اتصال OpenCode: <span class="highlight">${escapeHtml(errorText)}</span>. OpenCode را نصب و در PATH قرار دهید، سپس دوباره تلاش کنید.`, tags: [{ text: 'اتصال ناموفق', type: 'critical' }] });
    renderMessages();
    showToast(`پاسخ OpenCode دریافت نشد: ${errorText}`);
    return;
  }
  const answer = escapeHtml(response.result?.text || 'پاسخ خالی بود.').replace(/\r?\n/g, '<br>');
  messages.unshift({ id: Date.now() + 1, agent: 'pm', name: 'پرشین', role: `OpenCode محلی · ${escapeHtml(response.result?.model || 'catalog')}`, initial: 'پ', cls: 'judge-avatar', time: 'همین الان', body: answer, tags: [{ text: 'پاسخ واقعی OpenCode', type: '' }] });
  messageTotal += 1;
  document.getElementById('messageCount').textContent = toPersianDigits(messageTotal);
  renderMessages();
  showToast('پاسخ OpenCode در اتاق ثبت شد.');
}
function addMessage() {
  const value = messageInput.value.trim();
  if (!value) { showToast('اول یک پیام یا دستور برای اتاق بنویسید.'); messageInput.focus(); return; }
  messages.unshift({ id: Date.now(), agent: 'pm', name: 'شما · مالک پروژه', role: 'دستور به پرشین', initial: 'ح', cls: 'judge-avatar', time: 'همین الان', body: escapeHtml(value), tags: [{ text: 'دستور جدید', type: 'reply' }] });
  agentFilter.value = 'all'; currentView = 'all'; document.querySelectorAll('.view-toggle').forEach(button => button.classList.toggle('active', button.dataset.view === 'all')); renderMessages(); messageInput.value = ''; messageInput.style.height = 'auto'; messageTotal += 1; document.getElementById('messageCount').textContent = toPersianDigits(messageTotal); showToast('دستور شما به اتاق مشورت ارسال شد.');
  askOpenCode(value).catch(error => showToast(`خطای اجرای OpenCode: ${error.message || 'unknown_error'}`));
}
function gatewayStatus(profile) {
  if (profile.type === 'local-cli') return { label: profile.enabled ? 'پیش‌فرض' : 'غیرفعال', cls: profile.enabled ? 'gateway-ready' : 'gateway-neutral' };
  if (!profile.baseUrl || !profile.model || !profile.apiKeyEnv) return { label: 'ناقص', cls: 'gateway-warning' };
  if (!profile.keyConfigured) return { label: 'منتظر secret', cls: 'gateway-neutral' };
  return { label: 'آماده', cls: 'gateway-ready' };
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
  if (showMessage) showToast(`تنظیمات معتبر است؛ مقدار ${apiKeyEnv} باید در runtime موجود باشد.`);
  return true;
}
function saveGateway() {
  if (!validateGatewayForm(false)) { showToast('Base URL، مدل و نام secret را کامل و معتبر وارد کنید.'); return; }
  const previous = editingGatewayId ? gatewayProfiles.find(item => item.id === editingGatewayId) : null;
  const name = document.getElementById('gatewayName').value.trim() || 'درگاه سفارشی';
  const profile = { id: editingGatewayId || `custom-${Date.now()}`, name, type: 'openai-compatible', baseUrl: document.getElementById('gatewayBaseUrl').value.trim(), model: document.getElementById('gatewayModel').value.trim(), apiKeyEnv: document.getElementById('gatewayKeyEnv').value.trim(), enabled: previous?.enabled ?? true, keyConfigured: Boolean(document.getElementById('gatewayKeyInput').value.trim()) || Boolean(previous?.keyConfigured), note: 'profile ساخته‌شده در Council Room', badge: previous?.badge || 'Custom' };
  if (editingGatewayId) gatewayProfiles = gatewayProfiles.map(item => item.id === editingGatewayId ? profile : item); else gatewayProfiles.push(profile);
  persistGateways(); renderGateways(); closeGatewayForm(); showToast(`profile «${name}» ذخیره شد؛ secret در رابط ذخیره نشد.`);
}
function exportGateways() {
  const safeConfig = { version: 1, default: gatewayProfiles[0]?.id || null, profiles: gatewayProfiles.map(({ keyConfigured, ...profile }) => ({ ...profile, secret: `<env:${profile.apiKeyEnv}>` })) };
  const blob = new Blob([JSON.stringify(safeConfig, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'council-api-gateways.json'; link.click(); URL.revokeObjectURL(url); showToast('JSON امن دانلود شد؛ مقدار کلید داخل فایل نیست.');
}
async function loadProjectGateways() {
  try {
    const response = await fetch('/config/council.config.json', { cache: 'no-store' });
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
document.getElementById('pauseBtn').addEventListener('click', event => { isPaused = !isPaused; event.currentTarget.innerHTML = isPaused ? '<svg viewBox="0 0 24 24"><path d="m6 12 4 4L18 8"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>'; showToast(isPaused ? 'جلسه موقتاً متوقف شد.' : 'جلسه ادامه پیدا کرد.'); });
document.getElementById('approveBtn').addEventListener('click', () => { showToast('حکم تأیید شد؛ branch و Pull Request نمونه ساخته می‌شود.'); document.getElementById('approveBtn').innerHTML = 'حکم تأیید شد <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>'; document.getElementById('approveBtn').style.background = '#3a8b7e'; });
document.getElementById('approvalBtn').addEventListener('click', () => { showToast('تأیید شما ثبت شد و به قاضی اطلاع داده شد.'); document.getElementById('approvalBtn').textContent = 'تأیید شد'; document.getElementById('approvalBtn').disabled = true; });
document.querySelector('.decline-small').addEventListener('click', () => showToast('این درخواست برای بررسی بعدی علامت‌گذاری شد.'));
document.getElementById('detailsBtn').addEventListener('click', () => showToast('حکم کامل در فایل docs/opencode-council-scenario.md ثبت شده است.'));
document.getElementById('addGatewayBtn').addEventListener('click', () => openGatewayForm());
document.getElementById('cancelGatewayBtn').addEventListener('click', closeGatewayForm);
document.getElementById('gatewayPreset').addEventListener('change', event => { if (!editingGatewayId || event.target.value === 'custom') applyPreset(event.target.value); });
document.getElementById('checkGatewayBtn').addEventListener('click', async () => {
  if (!validateGatewayForm(false)) { showToast('Base URL، مدل و نام secret را کامل و معتبر وارد کنید.'); return; }
  if (!window.councilCompanion?.isDesktop || typeof window.councilCompanion.testProvider !== 'function') {
    showToast('تست اتصال واقعی فقط در نسخه دسکتاپ انجام می‌شود. کلید باید در متغیر محیطی ویندوز تنظیم شده باشد.');
    return;
  }
  const button = document.getElementById('checkGatewayBtn');
  button.disabled = true;
  button.textContent = 'در حال تست…';
  try {
    const result = await window.councilCompanion.testProvider({
      id: editingGatewayId || 'provider-test',
      baseUrl: document.getElementById('gatewayBaseUrl').value.trim(),
      model: document.getElementById('gatewayModel').value.trim(),
      apiKeyEnv: document.getElementById('gatewayKeyEnv').value.trim()
    });
    showToast(result.ok ? `اتصال موفق؛ ${result.result.models} مدل شناسایی شد.` : `تست اتصال ناموفق: ${result.error}`);
  } catch (error) {
    showToast(`تست اتصال ناموفق: ${error.message || 'provider_test_failed'}`);
  } finally {
    button.disabled = false;
    button.textContent = 'تست اتصال';
  }
});
document.getElementById('saveGatewayBtn').addEventListener('click', saveGateway);
document.getElementById('exportGatewayBtn').addEventListener('click', exportGateways);

renderAgents(); renderMessages(); renderGateways(); loadProjectGateways();
let seconds = 1397;
setInterval(() => { if (!isPaused) { seconds += 1; const h = String(Math.floor(seconds / 3600)).padStart(2, '۰'); const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '۰'); const s = String(seconds % 60).padStart(2, '۰'); document.getElementById('elapsed').textContent = `${h}:${m}:${s}`; } }, 1000);
