# 🚀 Быстрая настройка Google OAuth для Swipy

## ⚡ 5 минут до рабочего Google OAuth

### 1️⃣ **Google Cloud Console (2 мин)**
1. Перейди в [Google Cloud Console](https://console.cloud.google.com/)
2. Создай новый проект: `Swipy OAuth`
3. Включи **Google Identity API**
4. **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Тип: **Web application**
6. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.vercel.app
   ```
7. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.vercel.app/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```

### 2️⃣ **Supabase Dashboard (1 мин)**
1. **Authentication** → **Providers**
2. Включи **Google**
3. Вставь **Client ID** и **Client Secret** из Google Cloud Console

### 3️⃣ **Supabase Settings (1 мин)**
1. **Authentication** → **Settings**
2. **Site URL**: `https://your-domain.vercel.app`
3. **Redirect URLs**:
   ```
   https://your-domain.vercel.app/auth/callback
   https://your-domain.vercel.app/home
   http://localhost:3000/auth/callback
   http://localhost:3000/home
   ```

### 4️⃣ **Тест (1 мин)**
1. Запусти приложение: `npm run dev`
2. Перейди на `/login`
3. Нажми **Continue with Google**
4. ✅ Должен открыться Google OAuth popup

## 🔧 Если не работает:

### ❌ **"redirect_uri_mismatch"**
- Проверь точное совпадение redirect URI в Google Cloud Console
- Убедись, что нет лишних пробелов

### ❌ **"invalid_client"**
- Проверь Client ID и Client Secret в Supabase
- Убедись, что Google provider включен

### ❌ **Popup не открывается**
- Проверь блокировщики рекламы
- Убедись, что используешь HTTPS в production

## 🎯 **Готово!**

После этих 4 шагов Google OAuth будет работать как в development, так и в production!

**Время настройки: ~5 минут** ⏱️
