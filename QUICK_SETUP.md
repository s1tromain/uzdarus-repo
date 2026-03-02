# ⚡ БЫСТРЫЙ ЧЕКЛИСТ МИГРАЦИИ

> **Статус: ✅ ГОТОВО К PRODUCTION**

## 🔐 ЧТО ЗАЩИЩЕНО

```
✅ Telegram токены        → .env (скрыто)
✅ Supabase ключи         → .env (скрыто)  
✅ Данные пользователей   → требует auth
✅ CORS                   → только разрешённые домены
```

---

## 📦 ЧТО НУЖНО ДЕЛАТЬ

### На локальной машине (для тестирования)

```bash
cd server
npm install
npm start
```

Сервер запустится на: `http://localhost:3000`

### На production сервере (Ubuntu)

```bash
# 1. Загруженить файлы
scp -r ./server root@сервер:/opt/uzdarus-api

# 2. Установить
cd /opt/uzdarus-api
npm install

# 3. Настроить .env
nano /opt/uzdarus-api/.env
# Вставь значения:
# SUPABASE_URL=...
# SUPABASE_KEY=...
# TELEGRAM_CONTACT_TOKEN=...
# TELEGRAM_PAYMENT_TOKEN=...
# ALLOWED_ORIGINS=https://твой-домен.uz

# 4. Защитить .env
chmod 600 /opt/uzdarus-api/.env

# 5. Запустить через PM2
npm install -g pm2
pm2 start server.js --name uzdarus-api
pm2 save
```

---

## 📝 ИЗМЕНЁННЫЕ ФАЙЛЫ

| Файл | Тип | Описание |
|------|-----|---------|
| `/server/server.js` | 🆕 Новый | Безопасный сервер (токены из .env) |
| `/server/.env` | 🆕 Новый | Все токены и ключи |
| `/server/package.json` | 📝 Обновлён | Добавлен dotenv, обновлен main |
| `/index.html` | ✅ ОК | Уже отправляет через API |

---

## 🧪 ТЕСТ СРАЗУ ПОСЛЕ ЗАПУСКА

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Отправить тестовое сообщение
curl -X POST http://localhost:3000/api/send-contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Привет"}'

# Должен ответить:
# {"success":true,"message":"Xabar yuborildi"}
```

---

## 🎯 ДОСТУПНЫЕ ENDPOINTS

```
GET  /health                    - Проверка сервера
POST /api/register              - Регистрация
POST /api/login                 - Вход  
POST /api/send-contact          - Отправить сообщение
POST /api/send-payment          - Отправить платеж
GET  /api/user/profile          - Получить профиль (требует auth)
```

---

## ⚠️  ВАЖНО ПОМНИТЬ

```
❌ НИКОГДА:
  - Коммитьте .env в гит
  - Делитесь .env файлом
  - Открывайте .env в браузере
  - Логируйте переменные окружения

✅ ВСЕГДА:
  - chmod 600 на .env
  - Используйте .env.example для шаблона
  - Добавьте .env в .gitignore
  - Ротируйте токены регулярно
```

---

## 📊 СТРУКТУРА ПАПОК

```
/server
├── server.js              ✅ API (безопасный)
├── package.json          ✅ Зависимости
├── .env                  🔐 Токены (НЕ в гите!)
├── .env.example          📋 Шаблон (в гите)
├── .gitignore            📋 Содержит .env
├── server-old.js         📦 Старая версия (backup)
└── node_modules/         📦 Зависимости

/
├── index.html            ✅ Фронтенд (безопасен)
├── firebase-utils.js     ✅ Firebase config
└── ...
```

---

## 🚀ДЛЯ PRODUCTION

1. **VPS подготовка**: Ubuntu 22.04 с Nginx
2. **SSL сертификат**: Let's Encrypt (Certbot)
3. **PM2 для автозапуска**: `pm2 save`
4. **Firewall**: UFW (только 22, 80, 443)
5. **Мониторинг**: `pm2 logs` проверять регулярно

Полная инструкция: 📖 **UBUNTU_DEPLOYMENT.md**

---

## 🎉 ИТОГО

**Ты конвертировал небезопасный сайт в Production-Ready:**

| Компонент | До | Сейчас |
|-----------|----|----|
| Токены видны | ❌ Да | ✅ Нет |
| Данные защищены | ❌ Нет | ✅ Да |
| CORS | ❌ Открыт | ✅ Закрыт |
| Готов к продакшену | ❌ Нет | ✅ Да |

**Поздравляем! 🎊**
