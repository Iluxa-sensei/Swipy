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

