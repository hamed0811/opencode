# نسخه دسکتاپ ویندوزی Council Room

این پروژه اکنون دو حالت دارد: نسخه وب فعلی و نسخه دسکتاپ Electron. نسخه دسکتاپ همان داشبورد را در یک پنجره مستقل ویندوز اجرا می‌کند و از طریق Windows Companion فقط ابزارهای مجاز را شناسایی می‌کند.

## اجرای توسعه

```powershell
npm install
npm run desktop
```

## ساخت Installer و نسخه Portable روی ویندوز

```powershell
npm run desktop:installer
```

خروجی‌ها در پوشه `dist/` ساخته می‌شوند: یک Installer قابل نصب و یک نسخه Portable.

## شناسایی ایجنت‌ها

Companion فقط وجود executableها و نسخه آن‌ها را بررسی می‌کند؛ محتوای پروژه‌ها، فایل‌های شخصی و Secretها را بدون مجوز نمی‌خواند. موارد اولیه شامل OpenCode، Claude Code، Cursor، Cline، Aider، Gemini CLI، Git، Node.js، Python، Docker و VS Code است.

نتیجه از طریق API محدود `window.councilCompanion.detectLocalTools()` در اختیار رابط قرار می‌گیرد. کلید OpenAI و GitHub نباید در frontend یا فایل نصب قرار گیرند؛ برای اتصال واقعی باید در Secret امن سرور یا Windows Credential Manager ثبت شوند.

## مدل امنیتی

Electron با `contextIsolation`، بدون `nodeIntegration` و با preload محدود اجرا می‌شود. اجرای کد، تغییر فایل، push و ساخت Pull Request باید از policy و تأیید انسانی عبور کند. Merge و force-push در اختیار Companion نیست.

## وضعیت فعلی

پوسته دسکتاپ و API شناسایی آماده است. اتصال زنده به OpenAI، اتصال repository و ساخت Pull Request واقعی باید در مرحله سرور/Connector تکمیل شود؛ داشبورد فعلی سناریوی نمونه را نشان می‌دهد.
