# Деплой на Render.com

## Шаги для деплоя:

### 1. Подготовка GitHub репозитория
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/uzdarus-backend
git push -u origin main
```

### 2. Создание Render сервиса
1. Перейти на [render.com](https://render.com)
2. Нажать **"New +"** → **"Web Service"**
3. Выбрать GitHub репозиторий `uzdarus-backend`
4. Настроить параметры:
   - **Name**: `uzdarus-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (для начала)

### 3. Установить переменные окружения
В Render dashboard:
1. Перейти в **Environment**
2. Добавить переменные из `.env` файла:
   ```
   SUPABASE_URL=https://gwflvqqncpbpbgcerfah.supabase.co
   SUPABASE_KEY=sb_publishable_Xi7vcWA-IIWIJrElUZTQQQ_kC6Awuj5
   
   TELEGRAM_CONTACT_TOKEN=8316080775:AAHixiWEXwaacyeq5NywMi_JdZJ_qtsbrIY
   TELEGRAM_CONTACT_CHAT_ID=8439904337
   
   TELEGRAM_PAYMENT_TOKEN=8709653363:AAHzR4xSgKIrZoe4Ue_JWrQDmM41hJjG-o0
   TELEGRAM_PAYMENT_CHAT_ID=8439904337
   
   PORT=3000
   NODE_ENV=production
   ```

### 4. Обновить фронтенд на Netlify

В HTML файлах (`tolov.html`, `index.html`), заменить:
```javascript
// ДО:
const response = await fetch('http://localhost:3000/api/send-payment', {

// ПОСЛЕ:
const response = await fetch('https://uzdarus-api.onrender.com/api/send-payment', {
```

> **URL будет выглядеть так**: `https://uzdarus-api.onrender.com`  
> (точный URL будет показан после деплоя на Render)

### 5. Деплой на Netlify
1. Заменить localhost на Render URL во все API вызовах
2. Закинуть фронтенд на Netlify
3. Протестировать!

## Проверка

После деплоя проверить:
```bash
curl https://uzdarus-api.onrender.com/api/users
```

## Важные замечания

⚠️ **Free подписка на Render**:
- Сервер "спит" после 15 минут неактивности
- При первом запросе может быть задержка ~ 30 сек
- Для production используйте платный план

✅ **Альтернативы**:
- Railway.app (похоже на Render)
- Heroku (платно)
- Replit
