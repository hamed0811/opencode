# API gateway profiles

فایل `config/council.config.json` دو profile آماده برای endpointهای سازگار با OpenAI دارد:

- **OpenRouter** با `https://openrouter.ai/api/v1` و مدل نمونه `openai/gpt-4o-mini`.
- **OmniRoute** با `http://localhost:20128/v1` و مدل `auto` برای route و fallback محلی.

هیچ مقدار API key داخل repository ذخیره نمی‌شود. مقدار واقعی را در محیط اجرای سرویس با نام متغیر ثبت‌شده در `apiKeyEnv` قرار دهید؛ برای profileهای پیش‌فرض این نام‌ها `OPENROUTER_API_KEY` و `OMNIROUTE_API_KEY` هستند. مقدار `${COUNCIL_APP_URL}` نیز فقط برای header شناسایی برنامه در OpenRouter است و باید با origin واقعی اجرا جایگزین شود.

رابط Council Room در کارت «درگاه‌های API» اجازه می‌دهد profileهای بیشتری با هر endpoint سازگار با OpenAI اضافه کنید. این رابط فقط metadata و reference کلید را در `localStorage` نگه می‌دارد و مقدار secret را ذخیره یا نمایش نمی‌دهد. دکمه «بررسی تنظیمات» اعتبار URL، مدل و نام متغیر را بررسی می‌کند؛ بررسی واقعی provider باید در runtime امن انجام شود.

نمونه‌ی مصرف در کلاینت OpenAI-compatible:

```js
const client = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});
```

منابع رسمی برای endpointها: [OpenRouter API overview](https://openrouter.ai/docs/api-reference/overview)، [OmniRoute API](https://omniroute.online/api/)، و [OmniRoute repository](https://github.com/cheaper-inference/OmniRoute).
