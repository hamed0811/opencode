# OpenCode integration policy

طبق مستندات رسمی OpenCode، اجرای prompt غیرتعاملی با `opencode run "..."` انجام می‌شود و OpenCode به سرویس مشترک محلی خود متصل می‌شود یا آن را راه‌اندازی می‌کند. مدل‌ها از کاتالوگ OpenCode و دستور `/models` انتخاب می‌شوند؛ برای مدل مشخص می‌توان از `--model provider/model` استفاده کرد.

نسخه دسکتاپ Council Room از `opencode run` به‌عنوان مسیر پیش‌فرض استفاده می‌کند. این برنامه مدل‌های رایگان را hardcode نمی‌کند، چون فهرست مدل‌های رایگان تغییرپذیر است. کاربر می‌تواند در OpenCode از `/models` یک مدل رایگان را انتخاب کند یا `OPENCODE_MODEL` را برای اجرای مشخص تنظیم کند. برنامه با `OPENCODE_DISABLE_FREE_MODELS` کاری ندارد؛ اگر کاربر عمداً مدل‌های رایگان را خاموش کرده باشد، همان policy کاربر محترم است.

Providerهای دیگر در کانفیگ با وضعیت optional و disabled-by-default ثبت می‌شوند. فعال‌سازی آن‌ها فقط بعد از ثبت Secret متناظر و تأیید کاربر مجاز است. مقدار کلید در frontend، transcript، prompt، Git یا Pull Request قرار نمی‌گیرد.

منابع رسمی:

- https://opencode.ai/docs/cli/
- https://opencode.ai/docs/providers/
- https://opencode.ai/docs/models/
- https://opencode.ai/docs/config/
