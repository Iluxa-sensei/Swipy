# Настройка GPT API для Swipy

## Проблема
GPT API не работает, потому что отсутствует файл `.env` с API ключами.

## Решение

1. **Создайте файл `.env` в корне проекта** (D:\Swipy\.env)

2. **Добавьте следующие переменные:**

```env
# OpenAI GPT API Key (обязательно для AI функций)
# Получите ключ на: https://platform.openai.com/api-keys
VITE_GPT_API_KEY=sk-your-actual-api-key-here

# Adzuna Job Search API credentials
# Получите ключи на: https://developer.adzuna.com/
VITE_ADZUNA_APP_ID=your_adzuna_app_id
VITE_ADZUNA_APP_KEY=your_adzuna_app_key

# Опционально: ScrapingBee API key для парсинга описаний вакансий
# SCRAPINGBEE_API_KEY=your_scrapingbee_key
```

3. **Перезапустите AI сервер:**

```bash
npm run ai-server
```

## Текущий статус

✅ AI сервер запущен на порту 3001
❌ GPT API ключ не настроен (сервер работает, но GPT функции отключены)

## Проверка работы

После добавления ключей, сервер автоматически начнет использовать GPT API для:
- Умного поиска вакансий (понимание естественного языка)
- Суммаризации описаний вакансий

Без ключа GPT API, приложение будет использовать только прямой поиск через Adzuna API.

## Если ИИ всё равно не работает

1. **Запустите AI-сервер** (отдельно от фронтенда):
   ```bash
   npm run ai-server
   ```
   В консоли должно появиться: `AI Job Search server: http://localhost:3001`

2. **Проверьте `.env` в корне проекта** (рядом с `package.json`):
   - `VITE_ADZUNA_APP_ID` и `VITE_ADZUNA_APP_KEY` — без них поиск вакансий не работает. Ключи: https://developer.adzuna.com/
   - `VITE_GPT_API_KEY` — для умного разбора запроса и суммаризации. Ключ: https://platform.openai.com/api-keys

3. **Перезапустите после изменения `.env`**:
   - Остановите AI-сервер (Ctrl+C), снова выполните `npm run ai-server`.
   - При необходимости перезапустите фронтенд (`npm run dev`).

4. **Ошибка «Job search not configured»** — в `.env` не заданы ключи Adzuna. Добавьте их и перезапустите AI-сервер.

## Деплой на Vercel (домен)

На Vercel **не запускается** отдельный Node-сервер (`server/aiJobSearch.js`). Вместо него используются **Serverless Functions** в папке `api/`:

- `api/ai-job-search.js` — поиск вакансий (Adzuna + опционально GPT)
- `api/job-summary.js` — суммаризация описания вакансии (GPT + ScrapingBee)

**Что сделать в Vercel:**

1. В проекте в Vercel откройте **Settings → Environment Variables**.
2. Добавьте те же переменные (для продакшена они подхватываются и в API):
   - `VITE_ADZUNA_APP_ID`
   - `VITE_ADZUNA_APP_KEY`
   - `VITE_GPT_API_KEY` (для умного поиска и суммаризации)
   - при использовании «About this role»: `SCRAPINGBEE_API_KEY`
3. Сохраните и сделайте **Redeploy** проекта.

После деплоя запросы с сайта на `/api/ai-job-search` будут обрабатываться этими функциями, и переменные окружения из Vercel будут использоваться автоматически.

