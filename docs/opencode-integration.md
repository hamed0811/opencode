# OpenCode integration policy

طبق مستندات رسمی OpenCode، اجرای prompt غیرتعاملی با `opencode run "..."` انجام می‌شود و OpenCode به سرویس مشترک محلی خود متصل می‌شود یا آن را راه‌اندازی می‌کند. مدل‌ها از کاتالوگ OpenCode و دستور `/models` انتخاب می‌شوند؛ برای مدل مشخص می‌توان از `--model provider/model` استفاده کرد.

نسخه دسکتاپ Council Room از `opencode run` به‌عنوان مسیر پیش‌فرض استفاده می‌کند. این برنامه مدل‌های رایگان را hardcode نمی‌کند، چون فهرست مدل‌های رایگان تغییرپذیر است. کاربر می‌تواند در OpenCode از `/models` یک مدل رایگان را انتخاب کند یا `OPENCODE_MODEL` را برای اجرای مشخص تنظیم کند. برنامه با `OPENCODE_DISABLE_FREE_MODELS` کاری ندارد؛ اگر کاربر عمداً مدل‌های رایگان را خاموش کرده باشد، همان policy کاربر محترم است.

Providerهای دیگر در کانفیگ با وضعیت optional و disabled-by-default ثبت می‌شوند. فعال‌سازی آن‌ها فقط بعد از ثبت Secret متناظر و تأیید کاربر مجاز است. مقدار کلید در frontend، transcript، prompt، Git یا Pull Request قرار نمی‌گیرد.

منابع رسمی:

- https://opencode.ai/docs/cli/
- https://opencode.ai/docs/providers/
- https://opencode.ai/docs/models/
- https://opencode.ai/docs/config/


## Council Room multi-agent runtime

The desktop runtime starts six independent OpenCode CLI runs in parallel:
Requirements, Architect, Backend, Security, QA, and DevOps. Each run receives a role-specific prompt and the same user task. Every consultation runs with OpenCode's built-in plan agent (`--agent plan`), which blocks normal project edits. The runtime does not use the build agent for consultation. The Critic then reviews the independent findings. The Final Judge receives the findings and critique and must return a validated JSON decision.

The runtime uses the locally installed OpenCode CLI. It does not add a cloud provider or API key. It does not pass --auto. The plan agent blocks normal file edits; shell permissions remain governed by the user's OpenCode configuration.

Events are sent from Electron Main Process to the renderer through a narrow preload API. Each run is stored as a separate JSONL event log under Electron userData. Common credential patterns are redacted before events are persisted or displayed.

Cancel aborts the active CLI processes through the AbortSignal supported by Node child_process. Human approval records the user's decision only. It does not execute code, create a Git branch, push, merge, or deploy.

This is a real multi-agent consultation and judgment runtime. Agent-driven code changes, per-agent model selection, OS-level sandboxing, and automated Git handoff remain separate work.
