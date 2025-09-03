# 🚀 Настройка Supabase Backend для Swipy

Этот документ содержит пошаговые инструкции по настройке Supabase backend для вашего проекта Swipy.

## 📋 Что уже настроено

✅ **Сервисы Supabase:**
- `authService` - аутентификация пользователей
- `profileService` - управление профилями
- `startupService` - управление стартапами
- `swipeService` - управление лайками/пассами
- `chatService` - управление чатами
- `notificationService` - управление уведомлениями

✅ **React хуки:**
- `useStartups` - для работы со стартапами
- `useSwipes` - для работы со свайпами
- `useChats` - для работы с чатами
- `useProfile` - для работы с профилями

✅ **Схема базы данных:**
- Таблицы для профилей, стартапов, лайков, пассов, чатов, сообщений, уведомлений
- Row Level Security (RLS) политики
- Триггеры для автоматических уведомлений
- Функции для обработки взаимных лайков

## 🔧 Шаги по настройке

### 1. Создание .env.local файла

Создайте файл `.env.local` в корне проекта со следующими переменными:

```bash
# Supabase Configuration
VITE_PUBLIC_SUPABASE_URL="your_supabase_url_here"
VITE_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# Database URLs (if needed for direct access)
POSTGRES_URL="your_postgres_url_here"
POSTGRES_PRISMA_URL="your_postgres_prisma_url_here"
POSTGRES_URL_NON_POOLING="your_postgres_non_pooling_url_here"

# Supabase Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
SUPABASE_JWT_SECRET="your_jwt_secret_here"

# Database credentials
POSTGRES_USER="your_postgres_user_here"
POSTGRES_PASSWORD="your_postgres_password_here"
POSTGRES_DATABASE="your_postgres_database_here"
POSTGRES_HOST="your_postgres_host_here"
```

**Получите эти значения из Vercel Dashboard:**
1. Перейдите в ваш проект на Vercel
2. Откройте вкладку "Settings" → "Environment Variables"
3. Скопируйте значения для каждой переменной

### 2. Настройка Supabase Storage

В Supabase Dashboard создайте bucket для аватаров:

1. Перейдите в **Storage** → **Buckets**
2. Создайте новый bucket с именем `avatars`
3. Установите **Public** доступ
4. Добавьте RLS политику:

```sql
-- Политика для загрузки аватаров
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политика для просмотра аватаров
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Политика для удаления аватаров
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Применение схемы базы данных

1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте содержимое файла `supabase/schema.sql`
3. Выполните SQL скрипт

### 4. Настройка аутентификации

В Supabase Dashboard:

1. Перейдите в **Authentication** → **Settings**
2. Настройте **Site URL** (ваш домен)
3. Добавьте **Redirect URLs**:
   - `http://localhost:5173/**` (для разработки)
   - `https://your-domain.vercel.app/**` (для продакшена)

4. В **Email Templates** настройте шаблоны для:
   - Подтверждения email
   - Сброса пароля
   - Приветствия

### 5. Настройка OAuth провайдеров (опционально)

Для входа через Google/GitHub:

1. **Google OAuth:**
   - Создайте проект в Google Cloud Console
   - Получите Client ID и Client Secret
   - Добавьте в Supabase Dashboard

2. **GitHub OAuth:**
   - Создайте OAuth App в GitHub
   - Получите Client ID и Client Secret
   - Добавьте в Supabase Dashboard

## 🧪 Тестирование

### 1. Проверка подключения

Откройте консоль браузера и проверьте:
- Нет ли ошибок подключения к Supabase
- Правильно ли загружаются переменные окружения

### 2. Тест аутентификации

1. Попробуйте зарегистрировать нового пользователя
2. Проверьте, создался ли профиль в таблице `profiles`
3. Попробуйте войти в систему

### 3. Тест CRUD операций

1. Создайте тестовый стартап
2. Попробуйте лайкнуть/пропустить стартап
3. Проверьте создание уведомлений

## 🔒 Безопасность

✅ **Уже настроено:**
- Row Level Security (RLS) для всех таблиц
- Валидация переменных окружения
- Безопасные cookie настройки
- Автоматическая очистка данных при выходе

⚠️ **Дополнительные рекомендации:**
- Регулярно обновляйте зависимости
- Мониторьте логи Supabase
- Используйте HTTPS в продакшене
- Ограничьте доступ к service role key

## 🚀 Развертывание

### Vercel

1. Убедитесь, что все переменные окружения добавлены в Vercel
2. Перезапустите деплой
3. Проверьте работу в продакшене

### Локальная разработка

1. Скопируйте `.env.local` из Vercel:
   ```bash
   vercel env pull .env.local
   ```

2. Запустите проект:
   ```bash
   npm run dev
   ```

## 📱 Использование в компонентах

### Пример использования хуков:

```jsx
import { useStartups, useSwipes, useAuth } from '../hooks'

function HomePage() {
  const { user } = useAuth()
  const { startups, loading, createStartup } = useStartups()
  const { likes, likeStartup, passStartup } = useSwipes(user?.id)

  const handleLike = async (startupId) => {
    try {
      await likeStartup(startupId)
      // Показать уведомление об успехе
    } catch (error) {
      // Обработать ошибку
    }
  }

  // ... остальной код компонента
}
```

### Пример использования сервисов напрямую:

```jsx
import { startupService, authService } from '../services'

async function handleCreateStartup(startupData) {
  try {
    const user = await authService.getCurrentUser()
    const startup = await startupService.createStartup({
      ...startupData,
      owner_id: user.id
    })
    return startup
  } catch (error) {
    console.error('Error creating startup:', error)
    throw error
  }
}
```

## 🆘 Устранение неполадок

### Частые проблемы:

1. **"Supabase environment variables are missing"**
   - Проверьте `.env.local` файл
   - Убедитесь, что переменные начинаются с `VITE_PUBLIC_`

2. **"RLS policy violation"**
   - Проверьте, что пользователь аутентифицирован
   - Убедитесь, что RLS политики правильно настроены

3. **"Storage bucket not found"**
   - Создайте bucket `avatars` в Supabase Storage
   - Проверьте RLS политики для storage

### Полезные команды для отладки:

```sql
-- Проверить RLS политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public';

-- Проверить текущего пользователя
SELECT auth.uid();

-- Проверить профиль пользователя
SELECT * FROM profiles WHERE id = auth.uid();
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи в консоли браузера
2. Проверьте логи в Supabase Dashboard
3. Убедитесь, что все переменные окружения правильно настроены
4. Проверьте, что схема базы данных применена

---

**🎉 Поздравляем!** Ваш Supabase backend настроен и готов к использованию!
