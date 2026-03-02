# 🔐 ИНСТРУКЦИЯ: УТЕЧКА-ЗАЩИТА

## ✅ ЧТО УЖЕ СДЕЛАНО

### 1. server.js (обновлено)
- ✅ Все Telegram токены загружаются из `.env`, не из кода
- ✅ Supabase ключи из `.env`
- ✅ CORS ограничен до разрешенных доменов
- ✅ Правильная валидация и логирование

### 2. index.html (уже безопасно!)
- ✅ `sendToTelegram()` отправляет на `/api/send-contact`
- ✅ Тотены НЕ видны в браузере
- ✅ Все чувствительные операции через сервер

### 3. .env файл (создан)
```
SUPABASE_URL=...
SUPABASE_KEY=...
TELEGRAM_CONTACT_TOKEN=...
TELEGRAM_PAYMENT_TOKEN=...
```

---

## 📋 ПОСЛЕДНИЕ ШАГИ

### Шаг 1: npm install
На сервере в папке `/server`:
```bash
npm install dotenv
npm install
```

### Шаг 2: Запустить сервер
```bash
npm start
# или
node server.js
```

Должно показать:
```
╔══════════════════════════════════════╗
║  🚀 UzdaRus API Server Started       ║
╚══════════════════════════════════════╝

✅ Server running on http://localhost:3000
```

### Шаг 3: Обновить фронтенд (если нужно)

В `index.html` линия 1502 - обновить URL:

**БЫЛО:**
```js
const response = await fetch('http://localhost:3000/api/send-contact', {
```

**СТАЛО (для production):**
```js
const response = await fetch('https://твой-домена-сервера.com/api/send-contact', {
```

---

## 🔒 ЧТО ЗАЩИЩЕНО

| Данные | ДО | СЕЙЧАС |
|--------|----|----|
| Telegram токены | ❌ В коде | ✅ В .env |
| Supabase ключи | ❌ В коде | ✅ В .env |
| Пользовательские  данные | ❌ Доступны всем | ✅ Требует auth |
| CORS | ❌ Открыт всем | ✅ Только твой домен |

---

## 📝 .gitignore проверка

Убедись что в файле: `server/.gitignore`

```
.env
.env.local
node_modules/
*.log
```

**НИКОГДА не коммитьте `.env`!**

---

## 🧪 ТЕСТИРОВАНИЕ

### Тест 1: Health check
```bash
curl http://localhost:3000/health
# Ответ: {"status":"ok","timestamp":"..."}
```

### Тест 2: Отправить контактную форму
```bash
curl -X POST http://localhost:3000/api/send-contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Hello"}'
# Ответ: {"success":true,"message":"Xabar yuborildi"}
```

### Тест 3: Отправить платеж
```bash
curl -X POST http://localhost:3000/api/send-payment \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John",
    "phone":"+998911234567",
    "email":"john@test.com",
    "telegram":"@johndoe",
    "tariff":"GOLD",
    "course":"Russian"
  }'
```

---

## 🚨ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Ошибка: "SUPABASE_URL or SUPABASE_KEY not found"
```
❌ Решение: Проверь .env файл в папке /server
   Убедись что там все значения заполнены
```

### Ошибка: "Telegram token not configured"
```
❌ Решение: Проверь TELEGRAM_CONTACT_TOKEN в .env
   Вставь значение: 8316080775:AAHixiWEXwaacyeq5NywMi_JdZJ_qtsbrIY
```

### Ошибка: CORS blocked
```
❌ Решение: Обновите ALLOWED_ORIGINS в .env
   Пример: ALLOWED_ORIGINS=https://mysite.com,http://localhost:3000
```

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

- [ ] Скопирован новый `server.js`
- [ ] Создан файл `.env` с токенами
- [ ] `package.json` обновлен (добавлен dotenv)
- [ ] `npm install` выполнен
- [ ] Сервер запущен и отвечает на `/health`
- [ ] Тест Telegram отправки пройден
- [ ] `.env` добавлен в `.gitignore`
- [ ] Фронтенд обновлен с правильным URL (если production)
- [ ] Всё работает! 🎉

---

## 📊 СТРУКТУРА ПОСЛЕ ОБНОВЛЕНИЯ

```
/server
├── server.js              ✅ Новый, безопасный
├── server-old.js          (backup старой версии)
├── .env                   🔐 ВСЕ ТОКЕНЫ ЗДЕСЬ
├── .env.example           Шаблон (для гита)
├── .gitignore            (содержит .env)
├── package.json          ✅ Обновлен
├── node_modules/
└── ...

/
├── index.html             ✅ Безопасно (API calls)
├── firebase-utils.js      ✅ Если есть
└── ...
```

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ (опционально)

1. **Для production**: Загрузить на настоящий сервер (VPS)
2. **HTTPS**: Настроить SSL сертификат (Let's Encrypt)
3. **Nginx**: Настроить как reverse proxy
4. **PM2**: Автозапуск при перезагрузке
5. **Мониторинг**: Следить за логами

Всё детально описано в документе: `UBUNTU_DEPLOYMENT.md`

---

## ❓ ВОПРОСЫ?

Какой у тебя домен сервера? Нужно обновить эти значения:
- `ALLOWED_ORIGINS` в `.env`
- URL в `index.html` (строка 1502)
