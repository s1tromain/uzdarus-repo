# Деплой Node.js бэкенда на Render.com

## Шаг 1: Выбрать "Web Services"
- Нажать **"New Web Service"**

## Шаг 2: Подключить GitHub репозиторий

### 2.1 Если ещё нет GitHub репо:
1. Создать аккаунт на [github.com](https://github.com)
2. Создать новый репозиторий `uzdarus-backend`
3. На компьютере (в папке `server`):
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/uzdarus-backend
git push -u origin main
```

### 2.2 На Render:
1. Нажать **"Connect a repository"**
2. Авторизовать GitHub
3. Выбрать репозиторий `uzdarus-backend`
4. Нажать **"Connect"**

## Шаг 3: Конфигурация сервиса

Заполнить форму:

```
Name:                uzdarus-api
Environment:         Node
Region:              (выбрать ближайший, например Frankfurt)
Build Command:       npm install
Start Command:       npm start
Instance Type:       Free
```

Нажать **"Create Web Service"**

## Шаг 4: Добавить переменные окружения

1. В новом сервисе нажать **"Environment"** (в левом меню)
2. Нажать **"Add Environment Variable"**
3. Добавить каждую переменную из `.env` файла:

```
SUPABASE_URL = https://gwflvqqncpbpbgcerfah.supabase.co
SUPABASE_KEY = sb_publishable_Xi7vcWA-IIWIJrElUZTQQQ_kC6Awuj5

TELEGRAM_CONTACT_TOKEN = 8316080775:AAHixiWEXwaacyeq5NywMi_JdZJ_qtsbrIY
TELEGRAM_CONTACT_CHAT_ID = 8439904337

TELEGRAM_PAYMENT_TOKEN = 8709653363:AAHzR4xSgKIrZoe4Ue_JWrQDmM41hJjG-o0
TELEGRAM_PAYMENT_CHAT_ID = 8439904337

PORT = 3000
NODE_ENV = production
```

После каждой переменной нажать **"Save"**

## Шаг 5: Дождаться деплоя

- Render будет строить проект (~1-2 минуты)
- Когда будет готово, увидите зелёный статус **"Live"**

## Шаг 6: Получить URL сервера

В самом верху страницы сервиса вы увидите URL вроде:

```
https://uzdarus-api.onrender.com
```

**СКОПИРУЙТЕ ЭТОТ URL** — он нужен для фронтенда!

## Шаг 7: Тест

Откройте в браузере:
```
https://uzdarus-api.onrender.com/api/users
```

Должно вернуть JSON или ошибку (но не "Connection refused")

## ⚠️ Важно!

1. **НИКОГДА** не кладите `.env` файл на GitHub!
   - Проверьте что `.gitignore` содержит `.env`

2. Переменные окружения добавляются **только через Render dashboard**, не через файлы

3. После первого деплоя, каждый push в `main` ветку GitHub будет автоматически деплоиться на Render

## 🐌 Про free tier:

- Сервер может "спать" после 15 минут неактивности
- При первом запросе может быть задержка ~30 сек
- Для production нужна платная подписка

## Следующий шаг:

После того как получите Render URL (https://uzdarus-api.onrender.com), нужно обновить фронтенд!
