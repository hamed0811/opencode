(() => {
  const button = document.getElementById('companionBtn');
  const modal = document.getElementById('companionModal');
  const close = document.getElementById('closeCompanion');
  const scan = document.getElementById('scanCompanion');
  const status = document.getElementById('companionStatus');
  const results = document.getElementById('companionResults');
  if (!button || !modal) return;
  const open = () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); };
  const hide = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
  button.addEventListener('click', open);
  close.addEventListener('click', hide);
  modal.addEventListener('click', event => { if (event.target === modal) hide(); });
  scan.addEventListener('click', async () => {
    if (!window.councilCompanion?.detectLocalTools) {
      status.textContent = 'این صفحه در حالت وب اجرا می‌شود؛ برای شناسایی ابزارهای ویندوز، برنامه دسکتاپ را اجرا کنید.';
      results.innerHTML = '';
      return;
    }
    scan.disabled = true; status.textContent = 'در حال بررسی PATH ویندوز و نسخه ابزارها…'; results.innerHTML = '';
    try {
      const payload = await window.councilCompanion.detectLocalTools();
      results.innerHTML = payload.agents.map(item => `<div class="companion-result ${item.status}"><strong>${item.name}</strong><small>${item.status === 'available' ? `${item.details.command} · ${item.details.version}` : 'پیدا نشد'}</small></div>`).join('');
      const count = payload.agents.filter(item => item.status === 'available').length;
      status.textContent = `${count} ابزار پیدا شد · ${payload.hostname} · فقط شناسایی، بدون خواندن Secret`;
    } catch (error) { status.textContent = 'شناسایی انجام نشد؛ دسترسی Companion را بررسی کنید.'; }
    scan.disabled = false;
  });
})();
