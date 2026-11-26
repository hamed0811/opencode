# نسخه دسکتاپ ویندوزی Council Room

این پروژه دو حالت دارد: نسخه وب و نسخه دسکتاپ Electron. نسخه دسکتاپ داشبورد را در یک پنجره مستقل اجرا می‌کند.

## اجرای توسعه در PowerShell

```powershell
npm install
$env:COUNCIL_WORKSPACE = "F:\مسیر\پروژه"
npm run desktop
```

اگر `COUNCIL_WORKSPACE` را تنظیم نکنید، برنامه از پوشه جداگانه زیر استفاده می‌کند:

```
<userData>\\workspace
```

Runner مسیر واقعی پوشه را بررسی می‌کند. اجرای خارج از Workspace رد می‌شود. Renderer نمی‌تواند مقدار `cwd` را انتخاب کند.

## ساخت Installer و نسخه Portable

```powershell
npm run desktop:installer
```

خروجی‌ها در پوشه `dist/` ساخته می‌شوند.

## شناسایی ابزارها

Companion وجود executableها و نسخه آن‌ها را بررسی می‌کند. این کار به معنی اجرای Agent مستقل نیست. ابزارهای شناسایی‌شده شامل OpenCode، Claude Code، Cursor، Cline، Aider، Gemini CLI، Git، Node.js، Python، Docker و VS Code هستند.

## اجرای OpenCode

در نسخه فعلی، هر پیام کاربر یک درخواست به `opencode run` می‌فرستد. در ویندوز، مسیر CLI با `where.exe` پیدا می‌شود. فایل‌های اجرایی معمولی و shimهای npm مانند `.cmd` از طریق PowerShell فراخوانی می‌شوند.

این قابلیت هنوز Orchestrator چندایجنتی نیست. ایجنت‌های نمایش‌داده‌شده و پیام‌های اولیه در رابط نمونه هستند.

## امنیت Electron

- `contextIsolation` فعال است.
- `nodeIntegration` خاموش است.
- `sandbox` فعال است.
- پنجره‌های جدید و navigation از Renderer مسدود هستند.
- IPC فقط درخواست‌های پنجره اصلی و frame اصلی را می‌پذیرد.
- مسیر Workspace در Main Process تعیین می‌شود.
- مسیر واقعی پوشه بررسی می‌شود تا خروج از Workspace و عبور از symlink رد شود.

## محدودیت‌های فعلی

- Orchestrator و اجرای مستقل چند Agent هنوز پیاده‌سازی نشده‌اند.
- دکمه‌های تأیید و رد هنوز گردش‌کار واقعی ندارند.
- دکمه Pause فقط شمارنده زمان را متوقف می‌کند.
- Gatewayها هنوز اتصال واقعی و ذخیره امن Secret ندارند.
- اتصال GitHub، ساخت Branch و Draft PR هنوز پیاده‌سازی نشده‌اند.
- تست خودکار فعلی مرز Workspace را پوشش می‌دهد. تست کامل روی Windows هنوز لازم است.
