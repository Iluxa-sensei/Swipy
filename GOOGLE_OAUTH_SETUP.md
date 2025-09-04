# 🔐 Настройка Google OAuth для Supabase

## 📋 Предварительные требования

1. **Google Cloud Console проект** - для получения OAuth credentials
2. **Supabase проект** - уже настроен
3. **Домен** - для redirect URLs

## 🚀 Пошаговая настройка

### Шаг 1: Настройка Google Cloud Console

#### 1.1 Создание проекта
1. Перейди в [Google Cloud Console](https://console.cloud.google.com/)
2. Создай новый проект или выбери существующий
3. Включи **Google+ API** и **Google Identity API**

#### 1.2 Создание OAuth 2.0 credentials
1. Перейди в **APIs & Services** → **Credentials**
2. Нажми **Create Credentials** → **OAuth 2.0 Client IDs**
3. Выбери тип приложения: **Web application**
4. Заполни поля:
   - **Name**: `Swipy OAuth Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-vercel-domain.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     https://your-vercel-domain.vercel.app/auth/callback
     https://your-supabase-project.supabase.co/auth/v1/callback
     ```

#### 1.3 Получение credentials
После создания получишь:
- **Client ID** (например: `123456789-abcdef.apps.googleusercontent.com`)
- **Client Secret** (например: `GOCSPX-abcdefghijklmnop`)

### Шаг 2: Настройка Supabase

#### 2.1 Добавление Google provider
1. Перейди в **Supabase Dashboard** → **Authentication** → **Providers**
2. Найди **Google** и включи его
3. Заполни поля:
   - **Client ID**: вставь Client ID из Google Cloud Console
   - **Client Secret**: вставь Client Secret из Google Cloud Console
   - **Redirect URL**: оставь по умолчанию

#### 2.2 Настройка Site URL и Redirect URLs
1. Перейди в **Authentication** → **Settings**
2. **Site URL**: `https://your-vercel-domain.vercel.app`
3. **Redirect URLs** добавь:
   ```
   https://your-vercel-domain.vercel.app/auth/callback
   https://your-vercel-domain.vercel.app/home
   http://localhost:3000/auth/callback
   http://localhost:3000/home
   ```

### Шаг 3: Обновление переменных окружения

#### 3.1 Локальная разработка (.env.local)
```bash
# Существующие переменные
VITE_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
VITE_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Новые переменные для Google OAuth
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
VITE_GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### 3.2 Vercel (Production)
1. Перейди в **Vercel Dashboard** → **Project Settings** → **Environment Variables**
2. Добавь те же переменные:
   ```
   VITE_PUBLIC_SUPABASE_URL
   VITE_PUBLIC_SUPABASE_ANON_KEY
   VITE_GOOGLE_CLIENT_ID
   VITE_GOOGLE_CLIENT_SECRET
   ```

### Шаг 4: Тестирование

#### 4.1 Локальное тестирование
1. Запусти приложение: `npm run dev`
2. Перейди на `/login`
3. Нажми **Continue with Google**
4. Должен открыться Google OAuth popup
5. После авторизации перенаправление на `/home`

#### 4.2 Production тестирование
1. Задеплой на Vercel
2. Протестируй Google OAuth на продакшене
3. Убедись, что redirect работает корректно

## 🔧 Troubleshooting

### Проблема: "redirect_uri_mismatch"
**Решение**: Проверь, что redirect URI в Google Cloud Console точно совпадает с тем, что использует Supabase

### Проблема: "invalid_client"
**Решение**: Проверь Client ID и Client Secret в Supabase Dashboard

### Проблема: "popup_closed_by_user"
**Решение**: Это нормальное поведение, если пользователь закрыл popup

### Проблема: Не работает на мобильных устройствах
**Решение**: Убедись, что используешь HTTPS в production

## 📱 Дополнительные настройки

### Настройка для мобильных приложений
Если планируешь мобильное приложение, добавь в Google Cloud Console:
```
com.yourapp.swipy://oauth2redirect
```

### Настройка для PWA
Для Progressive Web App добавь:
```
https://your-domain.com/oauth2redirect
```

## 🎯 Проверка работоспособности

### ✅ Что должно работать:
1. **Кнопка "Continue with Google"** активна
2. **Google OAuth popup** открывается
3. **Авторизация** проходит успешно
4. **Перенаправление** на `/home` работает
5. **Профиль пользователя** создается автоматически
6. **Сессия** сохраняется в Supabase

### 🔍 Как проверить:
1. Открой **Supabase Dashboard** → **Authentication** → **Users**
2. Должен появиться новый пользователь с Google provider
3. В **Logs** должны быть записи об успешной авторизации

## 🚀 Готово!

После выполнения всех шагов Google OAuth будет полностью настроен и работать как в development, так и в production режимах.

**Удачи с интеграцией! 🎉**
