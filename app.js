const agents = [
  { id: 'pm', name: 'مدیر پروژه', role: 'هماهنگ‌کننده', initial: 'م', cls: 'judge-avatar', status: 'در حال هماهنگی', statusCls: 'active-status', active: false },
  { id: 'architect', name: 'معمار نرم‌افزار', role: 'معماری سیستم', initial: 'م', cls: 'architect-avatar', status: 'در حال بررسی', statusCls: 'active-status', active: true },
  { id: 'backend', name: 'متخصص بک‌اند', role: 'API و منطق کسب‌وکار', initial: 'ب', cls: 'backend-avatar', status: 'تکمیل‌شده', statusCls: 'done-status' },
  { id: 'frontend', name: 'متخصص فرانت‌اند', role: 'تجربه کاربری', initial: 'ف', cls: 'frontend-avatar', status: 'منتظر', statusCls: '' },
  { id: 'db', name: 'متخصص دیتابیس', role: 'مدل داده و Migration', initial: 'د', cls: 'db-avatar', status: 'تکمیل‌شده', statusCls: 'done-status' },
  { id: 'security', name: 'متخصص امنیت', role: 'Threat modeling', initial: 'ا', cls: 'security-avatar', status: 'در حال بررسی', statusCls: 'active-status' },
  { id: 'qa', name: 'متخصص تست', role: 'کیفیت و سناریوها', initial: 'ت', cls: 'qa-avatar', status: 'منتظر', statusCls: '' },
  { id: 'devops', name: 'متخصص DevOps', role: 'استقرار و عملیات', initial: 'د', cls: 'devops-avatar', status: 'تکمیل‌شده', statusCls: 'done-status' },
  { id: 'critic', name: 'منتقد مخالف', role: 'پیدا کردن ریسک‌ها', initial: 'ن', cls: 'critic-avatar', status: 'در حال نقد', statusCls: 'active-status' }
];

const messages = [
  { id: 1, agent: 'architect', name: 'معمار نرم‌افزار', role: 'معماری سیستم', initial: 'م', cls: 'architect-avatar', time: 'همین الان', body: 'برای نسخه اول، پیشنهاد من <em>Modular Monolith</em> است. مرز پرداخت را داخل یک ماژول مستقل نگه می‌داریم تا بدون هزینه عملیاتی سرویس جدا، مسیر استخراج آینده باز بماند.', tags: [{ text: 'پیشنهاد معماری', type: '' }] },
  { id: 2, agent: 'security', name: 'متخصص امنیت', role: 'Threat modeling', initial: 'ا', cls: 'security-avatar', time: '۱ دقیقه پیش', body: 'با اصل تصمیم موافقم، اما <span class="highlight">وب‌هوک درگاه نباید مستقیماً تراکنش را نهایی کند</span>. به idempotency key و بررسی امضای درخواست نیاز داریم.', tags: [{ text: 'ریسک بالا', type: 'critical' }, { text: 'در پاسخ به معمار', type: 'reply' }] },
  { id: 3, agent: 'backend', name: 'متخصص بک‌اند', role: 'API و منطق کسب‌وکار', initial: 'ب', cls: 'backend-avatar', time: '۲ دقیقه پیش', body: 'در این ساختار، لایه <em>PaymentGateway</em> را پشت یک interface نگه می‌داریم. تست درگاه آزمایشی و جایگزینی Provider ساده‌تر می‌شود.', tags: [{ text: 'قابل اجرا', type: '' }] },
  { id: 4, agent: 'critic', name: 'منتقد مخالف', role: 'پیدا کردن ریسک‌ها', initial: 'ن', cls: 'critic-avatar', time: '۳ دقیقه پیش', body: 'اگر حجم Refund بالا برود، صف فعلی ما کافی نیست. آیا بهتر نیست از همین ابتدا یک Worker جدا برای پردازش رویدادهای پرداخت داشته باشیم؟', tags: [{ text: 'چالش باز', type: 'critical' }] },
  { id: 5, agent: 'qa', name: 'متخصص تست', role: 'کیفیت و سناریوها', initial: 'ت', cls: 'qa-avatar', time: '۵ دقیقه پیش', body: 'سناریوهای پرداخت ناموفق، callback تکراری و قطع ارتباط بعد از کسر وجه باید قبل از Merge پوشش داده شوند.', tags: [{ text: 'سناریوی تست', type: '' }] },
  { id: 6, agent: 'db', name: 'متخصص دیتابیس', role: 'مدل داده و Migration', initial: 'د', cls: 'db-avatar', time: '۷ دقیقه پیش', body: 'سه موجودیت payment، payment_event و refund کافی است. فیلد event_id باید unique باشد تا تکرار وب‌هوک تراکنش اضافه نسازد.', tags: [{ text: 'طرح داده', type: '' }] }
];

const agentList = document.getElementById('agentList');
const timeline = document.getElementById('timeline');
const agentFilter = document.getElementById('agentFilter');
const messageInput = document.getElementById('messageInput');
const toast = document.getElementById('toast');
let currentView = 'all';
let isPaused = false;

function renderAgents() {
  agentList.innerHTML = agents.map(agent => `
    <button class="agent-item ${agent.active ? 'active' : ''}" data-agent="${agent.id}">
      <span class="agent-avatar ${agent.cls}">${agent.initial}</span>
      <span class="agent-copy"><span class="agent-name">${agent.name}</span><span class="agent-role">${agent.role}</span><span class="status-line ${agent.statusCls}"><i></i>${agent.status}</span></span>
    </button>
  `).join('');
  agentList.querySelectorAll('.agent-item').forEach(button => button.addEventListener('click', () => {
    agentFilter.value = button.dataset.agent;
    renderMessages();
    showToast(`نمایش پیام‌های ${button.querySelector('.agent-name').textContent}`);
  }));
}

function renderMessages() {
  const selected = agentFilter.value;
  const filtered = messages.filter(message => {
    const matchesAgent = selected === 'all' || message.agent === selected;
    const matchesView = currentView === 'all' || message.tags.some(tag => tag.type === 'critical');
    return matchesAgent && matchesView;
  });
  if (!filtered.length) {
    timeline.innerHTML = '<div class="empty-state">برای این فیلتر هنوز پیامی ثبت نشده است.</div>';
    return;
  }
  timeline.innerHTML = filtered.map(message => `
    <article class="timeline-item" data-id="${message.id}">
      <div class="timeline-avatar-wrap"><span class="timeline-avatar agent-avatar ${message.cls}">${message.initial}</span></div>
      <div class="message-content"><div class="message-meta"><strong>${message.name}</strong><span class="role-tag">${message.role}</span><span class="message-time">${message.time}</span></div><p class="message-body">${message.body}</p><div class="message-tags">${message.tags.map(tag => `<span class="msg-tag ${tag.type}">${tag.text}</span>`).join('')}</div></div>
    </article>
  `).join('');
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function addMessage() {
  const value = messageInput.value.trim();
  if (!value) {
    showToast('اول یک پیام یا دستور برای اتاق بنویسید.');
    messageInput.focus();
    return;
  }
  messages.unshift({ id: Date.now(), agent: 'pm', name: 'شما · مدیر پروژه', role: 'دستور مالک پروژه', initial: 'ح', cls: 'judge-avatar', time: 'همین الان', body: value.replace(/</g, '&lt;'), tags: [{ text: 'دستور جدید', type: 'reply' }] });
  agentFilter.value = 'all'; currentView = 'all';
  document.querySelectorAll('.view-toggle').forEach(button => button.classList.toggle('active', button.dataset.view === 'all'));
  renderMessages(); messageInput.value = ''; messageInput.style.height = 'auto';
  document.getElementById('messageCount').textContent = String(Number(document.getElementById('messageCount').textContent) + 1).padStart(2, '۰');
  showToast('دستور شما به اتاق مشورت ارسال شد.');
}

agentFilter.addEventListener('change', renderMessages);
document.querySelectorAll('.view-toggle').forEach(button => button.addEventListener('click', () => {
  currentView = button.dataset.view;
  document.querySelectorAll('.view-toggle').forEach(item => item.classList.toggle('active', item === button));
  renderMessages();
}));
document.getElementById('sendBtn').addEventListener('click', addMessage);
messageInput.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); addMessage(); } });
messageInput.addEventListener('input', () => { messageInput.style.height = 'auto'; messageInput.style.height = `${Math.min(messageInput.scrollHeight, 100)}px`; });
document.getElementById('pauseBtn').addEventListener('click', event => { isPaused = !isPaused; event.currentTarget.innerHTML = isPaused ? '<svg viewBox="0 0 24 24"><path d="m6 12 4 4L18 8"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/>' ; showToast(isPaused ? 'جلسه موقتاً متوقف شد.' : 'جلسه ادامه پیدا کرد.'); });
document.getElementById('approveBtn').addEventListener('click', () => { showToast('حکم تأیید شد؛ اجرای اسکلت ماژول پرداخت آغاز می‌شود.'); document.getElementById('approveBtn').innerHTML = 'حکم تأیید شد <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>'; document.getElementById('approveBtn').style.background = '#3a8b7e'; });
document.getElementById('approvalBtn').addEventListener('click', () => { showToast('تأیید شما ثبت شد و به قاضی اطلاع داده شد.'); document.getElementById('approvalBtn').textContent = 'تأیید شد'; document.getElementById('approvalBtn').disabled = true; });
document.querySelector('.decline-small').addEventListener('click', () => showToast('این درخواست برای بررسی بعدی علامت‌گذاری شد.'));
document.getElementById('detailsBtn').addEventListener('click', () => showToast('متن کامل حکم در نسخه بعدی قابل مشاهده خواهد بود.'));

renderAgents();
renderMessages();

let seconds = 1122;
setInterval(() => { if (!isPaused) { seconds += 1; const h = String(Math.floor(seconds / 3600)).padStart(2, '۰'); const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '۰'); const s = String(seconds % 60).padStart(2, '۰'); document.getElementById('elapsed').textContent = `${h}:${m}:${s}`; } }, 1000);
