# 🚀 ГОТОВО К PRODUCTION! ФИНАЛЬНОЕ РУКОВОДСТВО

## ✅ ЧТО ПЕРЕДЕЛАНО

### 1️⃣ Telegram токены ЗАЩИЩЕНЫ
```
ДО:  Visible в index.html + в коде server.js
СЕЙЧАС: 🔒 ТОЛЬКО в file `/server/.env` (не в гите)
```

### 2️⃣ Supabase ключи ЗАЩИЩЕНЫ
```
ДО:  const SUPABASE_KEY = 'sb_...' (в коде!)  
СЕЙЧАС: 🔒 Загружается из .env через dotenv
```

### 3️⃣ Данные пользователей ЗАЩИЩЕНЫ
```
ДО:  GET /api/users возвращал ВСЕХ
СЕЙЧАС: 🔒 Требует авторизацию + возвращает только свои данные
```

### 4️⃣ CORS правильно настроен
```
ДО:  app.use(cors()) - открыто ВСЕМ
СЕЙЧАС: 🔒 Только разрешенные домены из .env
```

---

## 📋 ФАЙЛЫ КОТОРЫЕ ИЗМЕНИЛИСЬ

| Файл | Статус | Изменение |
|------|--------|-----------|
| `/server/server.js` | ✅ НОВЫЙ | Загружает переменные из `.env` |
| `/server/.env` | ✅ НОВЫЙ | Все токены и ключи |
| `/server/.env.example` | ✅ НОВЫЙ | Шаблон для гита |
| `/server/package.json` | ✅ ОБНОВЛЕН | Added dotenv, updated main |
| `/index.html` | ✅ OK | Уже отправляет через API |

---

## 🎯 ДЛЯ БЫСТРОГО СТАРТА

### На локальной машине / сервер:

#### 1. Убедись що установлены зависимости
```bash
cd server
npm install
```

#### 2. Запусти сервер
```bash
npm start
# или
node server.js
```

#### 3. Проверь что работает
```bash
curl http://localhost:3000/health
# Должен ответить: {"status":"ok","timestamp":"..."}
```

---

## 📝 СТРОКИ КОДА ДО И ПОСЛЕ

### ДО (НЕБЕЗОПАСНО)
```javascript
// server.js
const SUPABASE_KEY = 'sb_publishable_Xi7vcWA-IIWIJrElUZTQQQ_kC6Awuj5'; // 😱
const TELEGRAM_BOTS = {
    contact: { token: '8316080775:AAHixiWEXwaacyeq5NywMi_...' } // 😱
};
```

### СЕЙЧАС (БЕЗОПАСНО)
```javascript
// server.js
import dotenv from 'dotenv';
dotenv.config(); // Загружает из .env

const SUPABASE_KEY = process.env.SUPABASE_KEY; // 🔐
const TELEGRAM_BOTS = {
    contact: { token: process.env.TELEGRAM_CONTACT_TOKEN } // 🔐
};
```

---

## 🔐 ЧТО НЕЛЬЗЯ ВИДЕТЬ В ИСХОДНИКЕ

```
❌ Никогда в index.html:
   - Telegram токены
   - Supabase ключи
   - Firebase private keys
   - Database пароли
   - JWT secrets

✅ Всё это ТОЛЬКО в /server/.env
```

---

## 📊 ПРАВИЛЬНАЯ АРХИТЕКТУРА

```
┌─────────────────┐
│  Браузер        │
│ index.html      │
│ (без секретов)  │
└────────┬────────┘
         │ HTTPS
         │ /api/send-contact
         ▼
┌─────────────────┐
│ Node.js Server  │
│ server.js       │
│ /api/* endpoints
│                 │
│ Загружает из.env│
└────────┬────────┘
         │
   ┌─────┴─────────┐
   │               │
   ▼               ▼
[.env]      [Telegram API]
(ТОКЕНЫ)     (отправка)
```

---

## 🧪 ТЕСТЫ

### Тест 1: Контактная форма
```bash
curl -X POST http://localhost:3000/api/send-contact \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","message":"Hello"}'

# Ожидаемый ответ:
# {"success":true,"message":"Xabar yuborildi"}
```

### Тест 2: Платеж
```bash
curl -X POST http://localhost:3000/api/send-payment \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John",
    "phone":"+998901234567",
    "email":"john@test.com",
    "telegram":"@johndoe",
    "tariff":"GOLD",
    "course":"Russian"
  }'

# Ожидаемый ответ:
# {"success":true,"message":"To\'lov so\'rovi yuborildi"}
```

---

## 🌐ДЛЯ PRODUCTION (на реальном сервере)

### Шаг 1: Загрузить на VPS

```bash
# На твоем компьютере
scp -r ./server root@твой-сервер:/opt/uzdarus-api

# На VPS
cd /opt/uzdarus-api
npm install
```

### Шаг 2: Обновить .env на сервере

```bash
nano /opt/uzdarus-api/.env
# Заполни все значения

# Защити .env
chmod 600 /opt/uzdarus-api/.env
```

### Шаг 3: Запустить через PM2

```bash
npm install -g pm2
pm2 start server.js --name "uzdarus-api"
pm2 save
```

### Шаг 4: Nginx reverse proxy

```nginx
# /etc/nginx/sites-available/default
location /api {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Шаг 5: SSL через Certbot

```bash
certbot certonly --nginx -d твой-домен.uz
```

---

## 🔒 БЕЗОПАСНОСТЬ: ПЕРЕД PRODUCTION

- [ ] .env файл находится на сервере, НЕ в гите
- [ ] chmod 600 на .env файл
- [ ] CORS ALLOWED_ORIGINS обновлен с правильными доменами
- [ ] SSL сертификат установлен (HTTPS)
- [ ] Firewall правильно настроен (UFW)
- [ ] Логи проверены (pm2 logs)
- [ ] Все токены обновлены (они старые для примера!)

---

## ⚠️  ВАЖНО ПЕРЕД ЗАПУСКОМ

### Токены в .env примеры СТАРЫЕ!
Если ты используешь с production:

```bash
# Получи новые токены:
# 1. Telegram: @BotFather → /token
# 2. Supabase: console.firebase.google.com
# 3. Обновите в .env
```

### Твой домен, который нужно указать:

В `/server/.env`:
```
ALLOWED_ORIGINS=https://твой-домен.uz,https://www.твой-домен.uz,http://localhost:3000
```

В `/index.html` по необходимости:
```js
// Строка 1502
const response = await fetch('https://твой-домен.uz/api/send-contact', {
```

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

- [x] Все токены убраны из исходника
- [x] .env файл создан и заполнен
- [x] server.js переписан безопасно
- [x] CORS настроен правильно
- [x] package.json обновлен (dotenv)
- [x] API запущен и тестирован
- [ ] Развернуто на production сервере
- [ ] SSL включен
- [ ] Бэкапы настроены
- [ ] Мониторинг включен

---

## 🎉 ГОТОВО!

Сайт теперь **БЕЗОПАСЕН**:
- ✅ Все секреты на сервере
- ✅ Нет утечек в исходнике
- ✅ CORS защита
- ✅ Правильная архитектура

**Полным деплой:** смотри `UBUNTU_DEPLOYMENT.md`

---

## 📞 ПОДДЕРЖКА

Если что-то не работает:
1. Проверь логи: `pm2 logs`
2. Проверь .env: `node -e "console.log(process.env)"`
3. Проверь CORS: в браузере смотри console
4. Проверь Telegram token: попробуй curl на API
