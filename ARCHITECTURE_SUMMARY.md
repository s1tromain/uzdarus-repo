# 🏗️ АРХИТЕКТУРА И РЕЗЮМЕ

## 📊 ДИАГРАММА БЕЗОПАСНОЙ АРХИТЕКТУРЫ

```
┌─────────────────────────────────────────────────────────────────┐
│                         Интернет (HTTPS)                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
        ┌──────────────────────────────────────┐
        │     Фронтенд (Браузер)               │
        │  ┌────────────────────────────────┐  │
        │  │  HTML/CSS/JS                   │  │
        │  │  firebase-auth.js              │  │
        │  │  + Firebase Web SDK (Auth)     │  │
        │  │                                │  │
        │  │  ✅ firebaseConfig (публичный) │  │
        │  │  ❌ Service Account (НЕТ!)     │  │
        │  │  ❌ Telegram токены (НЕТ!)     │  │
        │  └────────────────────────────────┘  │
        └──────────────────────────────────────┘
                         │
                         │ HTTPS + ID Token
                         │ Authorization: Bearer <token>
                         ▼
        ┌──────────────────────────────────────┐
        │   Nginx (Reverse Proxy)              │
        │   ┌────────────────────────────────┐ │
        │   │ Port 80  → Redirect to 443     │ │
        │   │ Port 443 → SSL/TLS             │ │
        │   │ Let's Encrypt (Certbot)        │ │
        │   └────────────────────────────────┘ │
        │                                      │
        │  /api/* → http://localhost:3000    │
        │  /*     → /var/www/frontend        │
        └──────────────────────────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────────┐
        │   Node.js Express API (PM2)          │
        │   /opt/uzdarus-api/src/api.js        │
        │                                      │
        │  ✅ Endpoints:                       │
        │  ├─ POST /api/register               │
        │  ├─ GET  /api/user/profile           │
        │  ├─ PUT  /api/user/profile           │
        │  ├─ GET  /api/lessons                │
        │  ├─ POST /api/lessons                │
        │  └─ POST /api/send-contact           │
        │                                      │
        │  ✅ Middleware:                      │
        │  ├─ verifyToken (Firebase ID Token) │
        │  ├─ CORS (только твой домен)        │
        │  └─ Body Parser (JSON)              │
        │                                      │
        │  🔒 .env Секреты (chmod 600):       │
        │  ├─ FIREBASE_PRIVATE_KEY            │
        │  ├─ TELEGRAM_*_TOKEN                │
        │  ├─ DATABASE_URL                    │
        │  └─ JWT_SECRET                      │
        └──────────────────────────────────────┘
                         │
                         │ Service Account
                         │ (приватный ключ)
                         ▼
        ┌──────────────────────────────────────┐
        │   Firebase Admin SDK                 │
        │   ├─ Authentication (createUser)    │
        │   ├─ Firestore (read/write)         │
        │   └─ Cloud Storage                  │
        └──────────────────────────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────────┐
        │   Firebase Backend (Google Cloud)   │
        │   ├─ Firestore (БД)                 │
        │   ├─ Storage                        │
        │   └─ Auth (управление пользователями)
        │                                      │
        │  Security Rules:                    │
        │  ├─ match /users/{uid}              │
        │  │   ✅ allow read if uid == auth  │
        │  │   ✅ allow write if uid == auth │
        │  │                                  │
        │  ├─ match /lessons/{id}             │
        │  │   ✅ only if userId == auth    │
        │  │   ✅ immutable logs (no update) │
        │  │                                  │
        │  └─ match /* → ❌ deny all         │
        └──────────────────────────────────────┘
```

---

## 📋 ТАБЛИЦА: ЧТО УХОДИТ КУДА

| Компонент | Фронтенд | Сервер | Примечание |
|-----------|----------|--------|-----------|
| `firebaseConfig` | ✅ YES | — | Публичный конфиг |
| Service Account JSON | ❌ NO | ✅ YES (.env) | СЕКРЕТ! |
| Firebase ID Token | ✅ (память) | ✅ (заголовок) | Временный, часа |
| Telegram Tokens | ❌ NO | ✅ YES (.env) | СЕКРЕТ! |
| JWT Secret | ❌ NO | ✅ YES (.env) | СЕКРЕТ! |
| Database Password | ❌ NO | ✅ YES (.env) | СЕКРЕТ! |
| Пользовательские данные | ✅ (own) | ✅ (read) | Только свои по uid |
| Логи активности | ❌ | ✅ + Firebase | Server-side logging |

---

## 🔐 УРОВНИ ЗАЩИТЫ

### 🔒 Уровень 1: На фронтенде (браузер)
```
✅ HTTPS (SSL/TLS)
✅ Firebase Web SDK (безопасное подключение)
✅ ID Token в памяти (не localStorage)
✅ CORS проверка (только твой домен)
✅ Content Security Policy (CSP)
```

### 🔒 Уровень 2: На сервере (Node.js API)
```
✅ verifyToken middleware (Firebase)
✅ Проверка uid в Firestore operations
✅ Rate limiting для API
✅ Input validation & sanitization
✅ Логирование всех операций
✅ .env с chmod 600 для секретов
```

### 🔒 Уровень 3: В Firebase (Firestore Rules)
```
✅ Security Rules с проверкой auth
✅ Каждый пользователь видит только свои данные
✅ Админы имеют специальные роли
✅ Логи неизменяемые (immutable)
✅ Публичные данные (если нужны) - явно указаны
```

### 🔒 Уровень 4: Инфраструктура (Ubuntu)
```
✅ UFW Firewall (22, 80, 443)
✅ SSH Key-only (no password)
✅ Fail2Ban (защита от brute-force)
✅ SSL Certbot (обновление автоматическое)
✅ PM2 (автозапуск при перезагрузке)
✅ Логирование (PM2, Nginx)
```

---

## 📊 СРАВНЕНИЕ: ДО И ПОСЛЕ

### ❌ ДО (Небезопасно)

```javascript
// firebase-utils.js
const firebaseConfig = { apiKey: "AIza...", ...};

// server.js
const SUPABASE_KEY = 'sb_publish...'; // В ЯВНОМ ВИДЕ!
const TELEGRAM_TOKEN = '8316080...'; // В ЯВНОМ ВИДЕ!
```

```firestore rules
allow read: if true;     // Открыто ВСЕМ!
allow create: if true;   // Открыто ВСЕМ!
```

**Проблемы:**
- 🚨 Секреты видны в исходнике
- 🚨 Firestore читает ВСЕ
- 🚨 Нет проверки авторизации
- 🚨 Нет разделения прав доступа
- 🚨 Нет логирования

---

### ✅ ПОСЛЕ (Безопасно)

```javascript
// client/firebase-auth.js
export async function apiCall(endpoint, method, body) {
    const options = {
        headers: {
            'Authorization': `Bearer ${currentIdToken}` // 🔒 Токен!
        }
    };
    return fetch(`/api${endpoint}`, options);
}
```

```javascript
// server/src/api.js
async function verifyToken(req, res, next) {
    const idToken = req.headers.authorization?.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // 🔒 Проверено!
    next();
}

app.get('/api/lessons', verifyToken, async (req, res) => {
    // ✅ Только пользователи видят свои уроки
    const snapshot = await db.collection('lessons')
        .where('userId', '==', req.user.uid)
        .get();
});
```

```firestore rules
match /lessons/{id} {
    allow read: if request.auth.uid == resource.data.userId;
    allow create: if request.auth.uid == request.resource.data.userId;
}
```

**Преимущества:**
- ✅ Все секреты на сервере в .env
- ✅ Firestore защищен правилами
- ✅ Обязательная проверка токена
- ✅ Разделение прав по uid
- ✅ Полное логирование

---

## 🚀 ЖИЗНЕННЫЙ ЦИКЛ ЗАПРОСА: ПРИМЕР

### Сценарий: Пользователь получает свои уроки

```
1. ФРОНТЕНД (браузер)
   ├─ import firebase-auth.js ✅
   ├─ getMyLessons() вызывает apiCall('/lessons')
   └─ Получает currentIdToken из Firebase Auth
       └─ ID Token = "eyJhbGciOiJSUzI1NiIs..." (подписан Firebase)

2. HTTPS REQUEST
   ├─ GET /api/lessons HTTP/1.1
   ├─ Authorization: Bearer eyJhbGciOi...
   ├─ Host: твой-домен.com (HTTPS!)
   └─ Content-Type: application/json

3. NGINX (порт 443)
   ├─ Проверяет SSL сертификат ✅
   ├─ Обратный прокси к localhost:3000
   └─ Добавляет X-Forwarded-* заголовки

4. NODEJS API (порт 3000)
   ├─ verifyToken middleware:
   │  ├─ Получает токен из Authorization заголовка
   │  ├─ Вызывает admin.auth().verifyIdToken(token)
   │  └─ Если OK → req.user.uid = "abc123..."
   │
   ├─ GET /api/lessons handler:
   │  ├─ Запрашивает Firestore:
   │  │  └─ WHERE userId == "abc123..."
   │  │
   │  ├─ Security Rules проверяют:
   │  │  └─ if request.auth.uid == resource.data.userId
   │  │
   │  └─ Возвращает JSON с уроками

5. FIRESTORE (Google Cloud)
   ├─ Проверяет Service Account правильный ✅
   ├─ Выполняет WHERE query
   ├─ Применяет Security Rules
   └─ Возвращает только уроки с userId='abc123...'

6. ОТВЕТ (JSON)
   ├─ HTTP/1.1 200 OK
   ├─ HTTPS (зашифровано)
   └─ { "lessons": [ { id, title, content }, ... ] }

7. БРАУЗЕР
   ├─ Получает JSON
   ├─ Обновляет UI
   └─ Пользователь видит только СВОИ уроки ✅
```

---

## ✨ РЕЗУЛЬТАТ

| Показатель | Было | Стало |
|-----------|------|-------|
| Секреты в коде | ❌ Да (в файлах) | ✅ Нет (только в .env) |
| HTTPS | ❌ Нет | ✅ Да (Let's Encrypt) |
| Firestore Security | ❌ allow read: if true | ✅ uid-based access |
| Token Verification | ❌ Нет | ✅ Да (middleware) |
| Rate Limiting | ❌ Нет | ✅ Да (express-rate-limit) |
| Logging | ❌ Нет | ✅ Да (PM2, Nginx) |
| Auto-restart | ❌ Нет | ✅ Да (PM2, systemd) |
| SSL Auto-renewal | ❌ Нет | ✅ Да (Certbot) |
| Firewall | ❌ Нет | ✅ Да (UFW) |
| SSH Security | ❌ Пароль | ✅ Только ключи |

---

## 📞 ИТОГОВОЕ РЕЗЮМЕ

✅ **ДЛЯ РАЗРАБОТЧИКА:**
1. Используй `client/firebase-auth.js` вместо `firebase-utils.js`
2. Все API вызовы через `apiCall(endpoint)` (автоматически добавляет токен)
3. Тестируй локально перед pushing в GitHub

✅ **ДЛЯ DEVOPS:**
1. Получи Service Account Key из Firebase
2. Скопируй на VPS в `/opt/uzdarus-api/.env` с `chmod 600`
3. Запусти `npm install && pm2 start ecosystem.config.js`
4. Настрой Nginx как reverse proxy
5. Получи SSL через Certbot
6. Включи UFW firewall

✅ **ДЛЯ ОКРУЖАЮЩИХ:**
1. Не коммитьте `.env`
2. Ротируйте ключи каждые 30-90 дней
3. Мониторьте логи через `pm2 logs`
4. Обновляйте зависимости регулярно

---

## 🎓 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Nginx Security](https://nginx.org/en/docs/http/ngx_http_core_module.html)
- [Let's Encrypt](https://letsencrypt.org/)
- [Ubuntu Security Hardening](https://ubuntu.com/security/hardening)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ

- [ ] Выполни QUICK_START.md
- [ ] Разверни на Ubuntu используя UBUNTU_DEPLOYMENT.md
- [ ] Следуй SECURITY_CHECKLIST.md
- [ ] Мониторь через pm2 и Nginx логи
- [ ] Установи CD/CI pipeline для автоматических деплойментов

**🚀 Готово к безопасному запуску!**
