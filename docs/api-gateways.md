# API gateway catalog

فایل `config/council.config.json` اکنون یک catalog از ۱۸ profile آماده دارد. دو profile اول برای routerها هستند و بقیه providerهای مستقیم یا inference platformهای معروف‌اند.

## Routerها

- **OpenRouter** — `https://openrouter.ai/api/v1` — `OPENROUTER_API_KEY`
- **OmniRoute** — `http://localhost:20128/v1` — `OMNIROUTE_API_KEY`

## Model providerها

- **OpenAI** — `https://api.openai.com/v1` — `OPENAI_API_KEY`
- **Anthropic** — `https://api.anthropic.com/v1/` — `ANTHROPIC_API_KEY`
- **Google Gemini** — `https://generativelanguage.googleapis.com/v1beta/openai/` — `GEMINI_API_KEY`
- **Mistral AI** — `https://api.mistral.ai/openai/v1` — `MISTRAL_API_KEY`
- **DeepSeek** — `https://api.deepseek.com` — `DEEPSEEK_API_KEY`
- **xAI / Grok** — `https://api.x.ai/v1` — `XAI_API_KEY`
- **Cohere** — `https://api.cohere.com/compatibility` — `COHERE_API_KEY`

## Inference platformها

- **Groq** — `https://api.groq.com/openai/v1` — `GROQ_API_KEY`
- **Together AI** — `https://api.together.ai/v1` — `TOGETHER_API_KEY`
- **Fireworks AI** — `https://api.fireworks.ai/inference/v1` — `FIREWORKS_API_KEY`
- **Cerebras** — `https://api.cerebras.ai/v1` — `CEREBRAS_API_KEY`
- **SambaNova** — `https://api.sambanova.ai/v1` — `SAMBANOVA_API_KEY`
- **NVIDIA NIM** — `https://integrate.api.nvidia.com/v1` — `NVIDIA_API_KEY`
- **Hugging Face Inference** — `https://router.huggingface.co/v1` — `HF_TOKEN`

## Providerهای native REST

- **Perplexity Agent API** — `https://api.perplexity.ai/v1` — `PERPLEXITY_API_KEY`
- **Replicate** — `https://api.replicate.com/v1` — `REPLICATE_API_TOKEN`

بیشتر این profileها OpenAI-compatible هستند و می‌توانند با یک client مشترک استفاده شوند. Replicate native REST است و برای آن باید adapter جداگانه‌ی درخواست‌های مدل استفاده شود. Anthropic نیز برای قابلیت‌های کامل Claude بهتر است از Messages API native استفاده کند؛ profile موجود برای compatibility و شروع سریع است.

هیچ مقدار secret در فایل، localStorage یا خروجی JSON ذخیره نمی‌شود. فقط نام env در `apiKeyEnv` ثبت شده است. مقدار واقعی را در runtime امن پروژه تنظیم کنید. مدل‌های providerها تغییر می‌کنند؛ قبل از استفاده در production، مدل را از catalog رسمی همان provider بررسی یا با مقدار profile جایگزین کنید.

منابع رسمی در فیلد `officialSource` هر profile نیز ثبت شده‌اند. چند مرجع اصلی: [OpenRouter API](https://openrouter.ai/docs/api-reference/overview)، [OpenAI API](https://platform.openai.com/docs/api-reference/introduction)، [Google Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)، [Groq OpenAI compatibility](https://console.groq.com/docs/openai)، [Replicate HTTP API](https://replicate.com/docs/reference/http)، و [NVIDIA NIM API reference](https://docs.nvidia.com/nim/large-language-models/reference/api-reference).
