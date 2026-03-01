# 🚀 БЫСТРЫЙ СТАРТ: МИГРАЦИЯ НА БЕЗОПАСНУЮ АРХИТЕКТУРУ

## 📋 ЧТО ИЗМЕНИЛОСЬ И ПОЧЕМУ

### ❌ БЫЛО (небезопасно):
```
브라우저                      VPS
  ↓ (Firebase Web SDK)         
[Firestore]              [Token в http]
(все read/write)              ↓
                        [Supabase API]
  
⚠️ Проблемы:
- Firestore rules = allow read: if true (открыто всем!)
- Sekrets в server.js (не в .env)
- Telegram tokens видны в коде
```

### ✅ СТАЛО (безопасно):
```
Браузер                      VPS                    Firebase
  ↓ (Firebase Auth Only)      ↓ (Verify Token)         ↓
[ID Token] → [API Gateway] → [Admin SDK] → [Firestore]
  ↓          ↓                  ↓
[REST]   [Nginx]          [Service Account]
         ↓                (в .env, chmod 600)
      [Security Rules]
      (uid проверка)
      
✅ Преимущества:
- Все секреты на сервере
- Firestore rules проверяют uid
- Telegram tokens в .env
```

---

## 🎯 4-ШАГОВЫЙ ПРОЦЕСС

### ШАГ 1️⃣: Подготовка на компьютере (5 мин)

#### 1.1 Обновить фронтенд (HTML → использует новый firebase-auth.js)
```html
<!-- index.html -->
<script type="module">
    import auth from './client/firebase-auth.js';
</script>

<!-- Больше НЕ используй это: -->
<!-- ❌ <script src="firebase-utils.js"></script> -->

<!-- Используй это: -->
✅ <script type="module" src="./client/firebase-auth.js"></script>
```

#### 1.2 Скопировать новые файлы с репозитория
```
server/src/api.js              ← Новый API
server/.env.example            ← Шаблон переменных
server/ecosystem.config.js     ← PM2 конфиг
client/firebase-auth.js        ← Новый фронтенд код
client/auth-example.html       ← Пример страницы
firestore.rules                ← Обновленные правила
nginx-config.example           ← Конфиг Nginx
UBUNTU_DEPLOYMENT.md           ← Гайд для VPS
SECURITY_CHECKLIST.md          ← Чек-лист
```

#### 1.3 Git: добавить .env в .gitignore
```bash
# server/.gitignore
.env
.env.local
serviceAccountKey.json
```

### ШАГ 2️⃣: Настройка на локальном сервере (10 мин)

#### 2.1 Установить зависимости
```bash
cd server
npm install
npm install firebase-admin dotenv
```

#### 2.2 Создать .env файл (локальный тест)
```bash
cp .env.example .env
# Отредактируй:
# FIREBASE_PROJECT_ID=uzdarus-b97aa
# FIREBASE_PRIVATE_KEY="-----BEGIN..."
# и т.д. (скопируй из serviceAccountKey.json из Firebase)
```

#### 2.3 Запустить локально
```bash
npm start
# или
nodemon src/api.js
```

#### 2.4 Тестировать
```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Попробовать регистрацию
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{"email":"test@test.com","name":"Test"}'
```

### ШАГ 3️⃣: Получить Service Account Key от Firebase (5 мин)

#### 3.1 Зайти в Firebase Console
```
https://console.firebase.google.com/
→ Project=uzdarus-b97aa
→ Settings (gear icon)
→ Service Accounts
→ Generate New Private Key
```

#### 3.2 Скачать JSON и открыть
```json
{
  "type": "service_account",
  "project_id": "uzdarus-b97aa",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxx@uzdarus-b97aa.iam.gserviceaccount.com",
  ...
}
```

#### 3.3 Скопировать значения в (локальный) .env
```bash
FIREBASE_PROJECT_ID=uzdarus-b97aa
FIREBASE_PRIVATE_KEY_ID=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@uzdarus-b97aa.iam.gserviceaccount.com
```

### ШАГ 4️⃣: Развертывание на Ubuntu VPS (30 мин)

#### 4.1 Подключиться к VPS
```bash
ssh root@твой-домен.com
```

#### 4.2 Последовать инструкции из UBUNTU_DEPLOYMENT.md
```bash
# ЭТАП 1-3: Базовая установка
bash INSTALL_UBUNTU.sh

# ЭТАП 4: Развертывание приложения
mkdir -p /opt/uzdarus-api
scp -r ./server/* root@твой-домен:/opt/uzdarus-api/
cd /opt/uzdarus-api
npm install

# ЭТАП 4.4: Создать .env (копируй значения из локального .env)
nano /opt/uzdarus-api/.env
chmod 600 /opt/uzdarus-api/.env

# ЭТАП 4.6: Запустить
pm2 start ecosystem.config.js
pm2 save

# ЭТАП 5: Nginx
# ... (следуй гайду)
```

#### 4.3 Проверить, что работает
```bash
curl https://твой-домен.com/health
# {"status":"ok",...}

curl https://твой-домен.com/
# Должна вернуться HTML страница фронтенда
```

---

## ✅ ЧЕКЛИСТ МИГРАЦИИ

- [ ] Скачана Service Account Key из Firebase
- [ ] Обновлены файлы: server/src/api.js, client/firebase-auth.js
- [ ] Создан .env файл с секретами (локально)
- [ ] .env добавлен в .gitignore
- [ ] `npm install firebase-admin dotenv` выполнена
- [ ] Локально API запускается: `pm2 start ecosystem.config.js`
- [ ] Firestore Rules обновлены и развернуты: `firebase deploy --only firestore:rules`
- [ ] На VPS: Ubuntu 22.04, домен, Nginx, SSL готовы
- [ ] На VPS: .env создан с `chmod 600`
- [ ] На VPS: `pm2 start ecosystem.config.js` запущен
- [ ] На VPS: Nginx перенаправляет /api и /
- [ ] Фронтенд обновлен: использует новый firebase-auth.js
- [ ] Протестирована регистрация через новый API
- [ ] Протестирована загрузка уроков через /api/lessons
- [ ] Security Rules работают: другие пользователи НЕ видят твои данные

---

## 🔧ДЛЯ РАЗРАБОТКИ: Советы

### Локальное тестирование
```bash
# Стартовать фронтенд на порту 8000
python -m http.server 8000 --directory client

# Стартовать API на порту 3000
npm start

# Посетить: http://localhost:8000/auth-example.html
```

### Отладка в браузере
```js
// developer console
fetch('/health').then(r => r.json()).then(console.log)
// {"status":"ok",...}

// Провери localstorage
localStorage.getItem('firebase:uzdarus-b97aa:user')
```

### Логи API
```bash
# На VPS
pm2 logs uzdarus-api
pm2 logs uzdarus-api --err
pm2 logs uzdarus-api --lines 100 --follow
```

---

## 🚨ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### API говорит: "Invalid token"
```
❌ Проблема: Firebase ID Token невалидный
✅ Решение: 
   1. Проверь firebaseConfig в firebase-auth.js (projectId должен совпадать)
   2. Убедись, что token отправляется в заголовке: Authorization: Bearer <token>
   3. На сервере проверь FIREBASE_PROJECT_ID в .env
```

### Nginx говорит: 502 Bad Gateway
```
❌ Проблема: API не запущен или слушает не на 3000
✅ Решение:
   pm2 status
   pm2 start ecosystem.config.js
   netstat -tlnp | grep 3000
```

### Firestore: отказывает в доступе
```
❌ Проблема: Security Rules не обновлены
✅ Решение:
   firebase deploy --only firestore:rules
   Проверь в консоли: должно быть запущено
```

### .env: Permission Denied
```
❌ Проблема: Права доступа неправильные
✅ Решение:
   chmod 600 /opt/uzdarus-api/.env
   ls -la /opt/uzdarus-api/.env  # Должно быть: -rw------- root root
   pm2 restart uzdarus-api
```

---

## 📞ДОП. КОМАНДЫATTEMPTED

```bash
# Проверить PM2 состояние
pm2 status
pm2 save

# Очистить логи
pm2 flush

# Перезагрузить API
pm2 restart uzdarus-api

# Просмотр окончаний запуска
pm2 show uzdarus-api

# Kill все процессы
pm2 kill

# Мониторь в реальном времени
pm2 monit

# Просмотр Nginx логов
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Тест конфига Nginx
nginx -t

# Перезагрузи Nginx
systemctl reload nginx

# Check ports
netstat -tlnp | grep LISTEN
```

---

## ✨ГОТОВО!

Теперь твоя платформа:
- ✅ Все секреты на сервере
- ✅ Firestore защищен Security Rules
- ✅ API проверяет Firebase ID Token
- ✅ HTTPS включен
- ✅ Firewall настроен
- ✅ Приложение автоматически рестартится

🎉 **Поздравляем с полной миграцией!**
