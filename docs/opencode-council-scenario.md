# سناریوی کامل جلسه مشورت برای ساخت `opencode`

این سند نمونه فرض می‌کند `opencode` یک CLI و runtime برای سپردن وظایف برنامه‌نویسی به ایجنت‌هاست؛ ایجنت‌ها repository را می‌خوانند، ابزارهای محدود اجرا می‌کنند، تغییرات را تست می‌کنند و در پایان Draft Pull Request می‌سازند.

## ۰) درخواست مالک پروژه

**حامد:** «در مخزن `hamed0811/opencode` یک هسته اولیه بسازید که بتواند مسئله را از من بگیرد، بین ایجنت‌ها پخش کند، اجرای ابزارها را در sandbox ثبت کند و برای تغییرات یک Pull Request بسازد. هیچ ایجنتی حق merge مستقیم ندارد.»

**Orchestrator:** هدف، معیار موفقیت و ریسک‌ها را ثبت می‌کند. معیار موفقیت این است که یک اجرای کامل از درخواست تا Draft PR با transcript و test report قابل مشاهده باشد.

## ۱) شناخت repository

**Repository Agent:** ساختار repo، branch فعلی، README، package manifest، تست‌ها و دستورات build را می‌خواند. اگر repository خالی باشد، این واقعیت را با evidence ثبت می‌کند و از ساخت اسکلت حداقلی پیشنهاد می‌دهد.

**Orchestrator:** «تا قبل از این گزارش هیچ فایلی تغییر نمی‌کند. خروجی این مرحله: `repo_snapshot.json`.»

## ۲) تقسیم کار مستقل

- Requirements: تعریف user story، acceptance criteria و مرز نسخه صفر.
- Architect: مقایسه monolith، modular monolith و چندسرویسی.
- Backend: طراحی message bus، run state و tool runner.
- Security: threat model برای shell، شبکه، Secret و Git.
- QA: تعریف unit، integration و end-to-end.
- DevOps: branch strategy، CI و Draft PR.
- Critic: تلاش برای رد تصمیم و پیدا کردن failure mode.

## ۳) پیام‌های نمونه اتاق

**معمار:** «پیشنهاد من Modular Agent Runtime است: Orchestrator، Message Bus، Tool Runner و Event Store interface جدا داشته باشند؛ نسخه صفر در یک repo بماند تا سرعت تحویل بالا باشد.»

**بک‌اند:** «هر run یک `run_id` و هر پیام یک `event_id` دارد. Tool Runner فقط allowlist را اجرا می‌کند و خروجی را با status، stdout خلاصه‌شده و artifact برمی‌گرداند.»

**امنیت:** «موافقم، اما شبکه باید deny-by-default باشد. `OPENAI_API_KEY` و GitHub token نباید در prompt، transcript، diff یا PR دیده شوند.»

**QA:** «حداقل تست‌ها: router، permission، ثبت idempotent event، خطای timeout و یک E2E از درخواست تا ساخت Draft PR.»

**DevOps:** «branch با نام `agent/opencode-bootstrap` ساخته شود. CI بعد از push، lint و test را اجرا کند و فقط در صورت سبز بودن Draft PR ایجاد شود.»

**منتقد مخالف:** «اگر Orchestrator بتواند مستقیماً main را تغییر دهد، یک hallucination می‌تواند پروژه را خراب کند. merge باید خارج از اختیار ایجنت بماند و Pull Request همیشه نیازمند انسان باشد.»

**پاسخ معمار:** «این نقد وارد است؛ policy را اصلاح می‌کنم: `main` در blockedTools قرار می‌گیرد و runner فقط push روی branch ایجنت را قبول می‌کند.»

## ۴) بسته تصمیم برای قاضی

| گزینه | مزیت | ریسک | نتیجه |
|---|---|---|---|
| Modular Agent Runtime + Tool Sandbox | سریع، تست‌پذیر، قابل استخراج | نیاز به policy دقیق | گزینه منتخب |
| Microservices از روز اول | جداسازی قوی | هزینه عملیاتی و پیچیدگی زیاد | رد شد |
| Agent آزاد با shell کامل | شروع بسیار سریع | ریسک بحرانی امنیتی | وتو شد |

## ۵) حکم نهایی

**Final Judge:** `APPROVED_WITH_CONDITIONS` با اطمینان ۰٫۹۱.

شرایط: allowlist ابزارها، sandbox، شبکه خاموش به‌صورت پیش‌فرض، redaction secret، تست permission و router، branch جدا، Draft PR و تأیید انسانی برای merge.

## ۶) اجرای تصمیم

1. Orchestrator branch `agent/opencode-bootstrap` را می‌سازد.
2. ایجنت‌ها اسکلت runtime و قرارداد eventها را می‌نویسند.
3. QA تست‌های unit و integration را اجرا می‌کند.
4. Security policy و تست عدم دسترسی مستقیم به main را بررسی می‌کند.
5. DevOps diff، test report و خلاصه تصمیم را به Draft PR می‌فرستد.
6. داشبورد وضعیت را از `CONSULTING` به `EXECUTING` و سپس `READY_FOR_REVIEW` تغییر می‌دهد.

## ۷) چیزی که کاربر در داشبورد می‌بیند

کاربر در ستون چپ وضعیت هر ایجنت را می‌بیند؛ در مرکز transcript و پاسخ‌های متقابل را می‌خواند؛ در نوار پیشرفت مرحله فعلی را می‌بیند؛ در ستون راست اختلاف‌نظر، ریسک، حکم قاضی و کارت تأیید انسانی را می‌بیند. دکمه ارسال پایین صفحه، دستور جدید را به Orchestrator می‌فرستد. chain-of-thought خصوصی نمایش داده نمی‌شود؛ فقط پیام‌های کاری، شواهد، tool callهای مجاز، diff خلاصه و تصمیم‌ها قابل مشاهده هستند.

## ۸) پایان جلسه

پس از سبز شدن CI، داشبورد لینک Draft PR، commit، تست‌های اجراشده و ریسک‌های باقی‌مانده را نشان می‌دهد. Merge فقط با تأیید صریح صاحب پروژه انجام می‌شود.
