const agents = [
  { id: 'pm', name: 'مدیر پروژه', role: 'هماهنگ‌کننده', initial: 'م', cls: 'judge-avatar', status: 'در حال هماهنگی', statusCls: 'active-status', active: false },
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
  { id: 1, agent: 'pm', name: 'مدیر پروژه', role: 'هماهنگ‌کننده', initial: 'م', cls: 'judge-avatar', time: 'همین الان', body: 'درخواست دریافت شد: برای مخزن <em>opencode</em> یک runtime بسازیم که وظایف برنامه‌نویسی را به ایجنت‌ها بسپارد، خروجی را در اتاق ثبت کند و در پایان Pull Request پیشنهاد دهد.', tags: [{ text: 'درخواست اصلی', type: '' }] },
  { id: 2, agent: 'architect', name: 'معمار نرم‌افزار', role: 'معماری runtime', initial: 'م', cls: 'architect-avatar', time: '۱ دقیقه پیش', body: 'پیشنهاد من <em>Modular Agent Runtime</em> است: Orchestrator، Message Bus، Tool Runner و Event Store جدا باشند؛ اما برای فاز صفر در یک repository و با interfaceهای مستقل شروع کنیم.', tags: [{ text: 'پیشنهاد معماری', type: '' }] },
  { id: 3, agent: 'security', name: 'متخصص امنیت', role: 'Sandbox و Secretها', initial: 'ا', cls: 'security-avatar', time: '۲ دقیقه پیش', body: 'موافقم، مشروط به اینکه اجرای shell و Git در sandbox انجام شود. <span class="highlight">توکن GitHub و کلید OpenAI نباید وارد پیام ایجنت‌ها، لاگ یا Pull Request شوند.</span>', tags: [{ text: 'ریسک بالا', type: 'critical' }, { text: 'در پاسخ به معمار', type: 'reply' }] },
  { id: 4, agent: 'backend', name: 'متخصص بک‌اند', role: 'Tool API و اجرا', initial: 'ب', cls: 'backend-avatar', time: '۳ دقیقه پیش', body: 'برای هر اجرا یک <em>run_id</em> و برای هر پیام یک event_id تولید می‌کنیم. Tool Runner فقط allowlist ابزارها را قبول می‌کند و نتیجه را ساختاریافته به Orchestrator برمی‌گرداند.', tags: [{ text: 'قابل اجرا', type: '' }] },
  { id: 5, agent: 'critic', name: 'منتقد مخالف', role: 'پیدا کردن ریسک‌ها', initial: 'ن', cls: 'critic-avatar', time: '۴ دقیقه پیش', body: 'اگر Orchestrator بتواند مستقیماً branch اصلی را تغییر دهد، یک تصمیم اشتباه می‌تواند کد را خراب کند. پیشنهاد می‌کنم PR اجباری باشد و merge همیشه بعد از تأیید انسانی بماند.', tags: [{ text: 'چالش باز', type: 'critical' }] },
  { id: 6, agent: 'qa', name: 'متخصص تست', role: 'کیفیت و CI', initial: 'ت', cls: 'qa-avatar', time: '۶ دقیقه پیش', body: 'حداقل تست فاز صفر: unit برای router، integration برای Message Bus، تست permission برای Tool Runner و یک سناریوی end-to-end که از درخواست تا draft PR را طی کند.', tags: [{ text: 'سناریوی تست', type: '' }] },
  { id: 7, agent: 'devops', name: 'متخصص DevOps', role: 'Branch و Pull Request', initial: 'د', cls: 'devops-avatar', time: '۷ دقیقه پیش', body: 'workflow باید روی branch با نام <em>agent/opencode-bootstrap</em> اجرا شود. CI بعد از push، lint و test را اجرا می‌کند و فقط در صورت سبز بودن، PR draft ساخته می‌شود.', tags: [{ text: 'GitHub flow', type: '' }] },
  { id: 8, agent: 'security', name: 'متخصص امنیت', role: 'Sandbox و Secretها', initial: 'ا', cls: 'security-avatar', time: '۸ دقیقه پیش', body: 'یک شرط دیگر: ابزارها باید با policy صریح فراخوانی شوند؛ دسترسی شبکه پیش‌فرض خاموش باشد و هر درخواست خارج از policy به تأیید انسانی برگردد.', tags: [{ text: 'شرط اجرا', type: 'critical' }] }
];

const agentList = document.getElementById('agentList');
const timeline = document.getElementById('timeline');
const agentFilter = document.getElementById('agentFilter');
const messageInput = document.getElementById('messageInput');
const toast = document.getElementById('toast');
let currentView = 'all';
let isPaused = false;
let messageTotal = 31;

function renderAgents() {
  agentList.innerHTML = agents.map(agent => `<button class="agent-item ${agent.active ? 'active' : ''}" data-agent="${agent.id}"><span class="agent-avatar ${agent.cls}">${agent.initial}</span><span class="agent-copy"><span class="agent-name">${agent.name}</span><span class="agent-role">${agent.role}</span><span class="status-line ${agent.statusCls}"><i></i>${agent.status}</span></span></button>`).join('');
  agentList.querySelectorAll('.agent-item').forEach(button => button.addEventListener('click', () => { agentFilter.value = button.dataset.agent; renderMessages(); showToast(`نمایش پیام‌های ${button.querySelector('.agent-name').textContent}`); }));
}

function renderMessages() {
  const selected = agentFilter.value;
  const filtered = messages.filter(message => (selected === 'all' || message.agent === selected) && (currentView === 'all' || message.tags.some(tag => tag.type === 'critical')));
  timeline.innerHTML = filtered.length ? filtered.map(message => `<article class="timeline-item" data-id="${message.id}"><div class="timeline-avatar-wrap"><span class="timeline-avatar agent-avatar ${message.cls}">${message.initial}</span></div><div class="message-content"><div class="message-meta"><strong>${message.name}</strong><span class="role-tag">${message.role}</span><span class="message-time">${message.time}</span></div><p class="message-body">${message.body}</p><div class="message-tags">${message.tags.map(tag => `<span class="msg-tag ${tag.type}">${tag.text}</span>`).join('')}</div></div></article>`).join('') : '<div class="empty-state">برای این فیلتر هنوز پیامی ثبت نشده است.</div>';
}

function showToast(text) { toast.textContent = text; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800); }
function addMessage() {
  const value = messageInput.value.trim();
  if (!value) { showToast('اول یک پیام یا دستور برای اتاق بنویسید.'); messageInput.focus(); return; }
  messages.unshift({ id: Date.now(), agent: 'pm', name: 'شما · مدیر پروژه', role: 'دستور مالک پروژه', initial: 'ح', cls: 'judge-avatar', time: 'همین الان', body: value.replace(/</g, '&lt;'), tags: [{ text: 'دستور جدید', type: 'reply' }] });
  agentFilter.value = 'all'; currentView = 'all'; document.querySelectorAll('.view-toggle').forEach(button => button.classList.toggle('active', button.dataset.view === 'all')); renderMessages(); messageInput.value = ''; messageInput.style.height = 'auto'; messageTotal += 1; document.getElementById('messageCount').textContent = String(messageTotal).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); showToast('دستور شما به اتاق مشورت ارسال شد.');
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
renderAgents(); renderMessages();
let seconds = 1397;
setInterval(() => { if (!isPaused) { seconds += 1; const h = String(Math.floor(seconds / 3600)).padStart(2, '۰'); const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '۰'); const s = String(seconds % 60).padStart(2, '۰'); document.getElementById('elapsed').textContent = `${h}:${m}:${s}`; } }, 1000);
