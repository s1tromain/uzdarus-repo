# 🔐 БЕЗОПАСНАЯ АРХИТЕКТУРА: ФРОНТЕНД + VPS + FIREBASE

> **Полная пошаговая инструкция по миграции с использованием Node.js + Nginx + Firebase Admin SDK**

## 🎯 ЧТО ТЫ ПОЛУЧИШЬ

После выполнения этих инструкций твой проект будет:

- ✅ **Без секретов в коде** (Firebase Service Account только на сервере)
- ✅ **С защищенным Firestore** (Security Rules проверяют uid)
- ✅ **С HTTPS** (SSL через Let's Encrypt)
- ✅ **С API Gateway** (все чувствительные операции через сервер)
- ✅ **С автозапуском** (PM2 + systemd)
- ✅ **С логированием** (PM2 + Nginx)
- ✅ **С файрволом** (UFW)

---

## 📚ДОКУМЕНТАЦИЯ (прочитай В ЭТОМ ПОРЯДКЕ!)

| Файл | Что делать | Время |
|------|-----------|-------|
| **📖 [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)** | Понять архитектуру и диаграммы | 10 мин |
| **🚀 [QUICK_START.md](QUICK_START.md)** | 4-шаговый процесс миграции | 30 мин |
| **🐧 [UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md)** | Пошаговая установка на Ubuntu 22.04 | 60 мин |
| **🔐 [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** | Чек-лист + ротация ключей | 20 мин |
| **📝 [SECURE_SETUP.md](SECURE_SETUP.md)** | Анализ текущих проблем | 5 мин |

---

## 🗂️ НОВЫЕ ФАЙЛЫ В ПРОЕКТЕ

### Основные
```
server/
  ├─ src/api.js                    ← Новый! Express API + Firebase Admin SDK
  ├─ .env.example                  ← Новый! Шаблон переменных окружения
  ├─ ecosystem.config.js           ← Новый! PM2 конфиг для автозапуска
  ├─ .gitignore                    ← ОБНОВЛЕНО: добавлен .env
  └─ package.json                  ← ОБНОВЛЕНО: добавлены firebase-admin, dotenv

client/
  ├─ firebase-auth.js              ← Новый! Безопасная аутентификация
  └─ auth-example.html             ← Новый! Пример страницы

nginx-config.example               ← Новый! Конфиг Nginx (reverse proxy)
firestore.rules                    ← ОБНОВЛЕНО! Security Rules с uid проверкой
```

### Гайды (начни отсюда!)
```
ARCHITECTURE_SUMMARY.md            ← Как устроено
QUICK_START.md                      ← 4 шага миграции
UBUNTU_DEPLOYMENT.md               ← Развертывание на VPS
SECURITY_CHECKLIST.md              ← Безопасность + ротация ключей
SECURE_SETUP.md                    ← Анализ проблем
INSTALL_UBUNTU.sh                  ← Скрипт установки зависимостей
```

---

## ⚡ БЫСТРЫЙ СТАРТ (5 МИНУТ)

### Если у тебя уже есть VPS с Ubuntu 22.04

```bash
# 1. На компьютере: обновить файлы
git pull  # загрузи новые файлы

# 2. На VPS: базовая установка
ssh root@твой-домен
bash INSTALL_UBUNTU.sh

# 3. На VPS: развертывание
mkdir -p /opt/uzdarus-api
scp -r ./server/* root@твой-домен:/opt/uzdarus-api/

cd /opt/uzdarus-api
npm install

# 4. На VPS: создать .env
nano /opt/uzdarus-api/.env  # Скопируй значения из Service Account Key
chmod 600 /opt/uzdarus-api/.env

# 5. На VPS: запустить
pm2 start ecosystem.config.js
pm2 save
```

### Если нет VPS
1. Получи VPS (DigitalOcean, Linode, Hetzner, AWS и т.д.)
2. Установи Ubuntu 22.04
3. Следуй **[UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md)** построчно

---

## 🔴 КРИТИЧЕСКИЕ ИЗМЕНЕНИЯ

### ❌ СТАРЫЙ КОД (НЕ ИСПОЛЬЗУЙ!)
```javascript
// ❌ ПЛОХО: firebase-utils.js
import { initializeApp } from 'firebase/app';
const firebaseConfig = { apiKey: "AIza...", ... };
const db = getFirestore(app);

// Все операции идут прямо в Firestore (без проверки!)
```

### ✅ НОВЫЙ КОД (ИСПОЛЬЗУЙ!)
```javascript
// ✅ ХОРОШО: client/firebase-auth.js
import authModule from './client/firebase-auth.js';

// 1. Аутентификация через Firebase (браузер)
await login(email, password);

// 2. Получить ID Token (автоматически)
const idToken = currentIdToken;

// 3. Все операции через API (с проверкой на сервере)
await apiCall('/api/lessons', 'GET');
// Сервер проверяет: require token + require uid
```

---

## 🔐 ЗАЩИЩЕННОСТЬ: ДО И ПОСЛЕ

### ❌ ДО
```
Фронтенд: firebaseConfig + WebSDK
           ↓ (прямой доступ!)
Firestore: allow read: if true  ← ОТКРЫТО ВСЕМ!
           allow write: if true ← ОТКРЫТО ВСЕМ!
```

**Проблема**: Каждый может читать/писать любые данные!

### ✅ ПОСЛЕ
```
Фронтенд: Firebase Auth + ID Token
           ↓ (ID Token отправляется)
Nginx:    Reverse proxy (SSL/TLS)
           ↓
Node.js:  API проверяет token + uid
           ↓
Firestore: match /lessons/{id}
           allow read: if uid == resource.data.userId ← ТОЛЬКО СВОИ!
```

**Преимущество**: Каждый видит только свои данные + все защищено на сервере!

---

## 📋 РЕКОМЕНДУЕМЫЙ ПОРЯДОК ДЕЙСТВИЙ

### День 1: Подготовка
- [ ] Прочитай [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)
- [ ] Загрузи Service Account Key из Firebase Console
- [ ] Получи или создай VPS с Ubuntu 22.04
- [ ] Prочитай [QUICK_START.md](QUICK_START.md)

### День 2: Локальное тестирование
- [ ] Обнови `server/package.json` и установи зависимости
- [ ] Создай локальный `.env` файл (по `.env.example`)
- [ ] Протестируй локально: `npm start`
- [ ] Проверь регистрацию нового пользователя

### День 3: Развертывание на VPS
- [ ] Подключись к VPS по SSH
- [ ] Выполни [UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md) построчно
- [ ] Настрой Nginx как reverse proxy
- [ ] Получи SSL сертификат через Certbot

### День 4: Финализация
- [ ] Обнови фронтенд (используй `client/firebase-auth.js`)
- [ ] Протестируй все эндпоинты: регистрация, вход, CRUD операции
- [ ] Развей Firestore Security Rules: `firebase deploy --only firestore:rules`
- [ ] Следуй [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)

---

## 🆘ПОМОЩЬ И F.A.Q.

### Q: Где хранить Service Account JSON?
**A:** ТОЛЬКО на сервере в `/opt/uzdarus-api/.env` с `chmod 600`. Никогда в гите!

### Q: Как отправить ID Token на сервер?
**A:** В заголовке: `Authorization: Bearer <idToken>`
```javascript
fetch('/api/data', {
    headers: {
        'Authorization': `Bearer ${idToken}`
    }
});
```

### Q: Что если потеряю .env файл?
**A:** Восстанови из `.env.example` и заполни значения:
```bash
cp .env.example .env
chmod 600 .env
# Сейчас отредактируй вручную
```

### Q: Как ротировать ключи?
**A:** Смотри [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md#-ротация-ключей)

### Q: API не запускается, что делать?
**A:** 
```bash
pm2 logs uzdarus-api
# Проверь ошибки, обычно:
# - .env не найден
# - Неверные FIREBASE_* переменные
# - Port 3000 занят
```

### Q: Firestore говорит "Permission Denied"
**A:**
```bash
# Обнови Security Rules
firebase deploy --only firestore:rules

# Проверь, что userId в documents совпадает с auth.uid
```

---

## 🎓 КЛЮЧЕВЫЕ КОНЦЕПЦИИ

### 1. Firebase ID Token
- **Что**: JWT токен, подписанный Firebase
- **Где**: Получается в браузере после login
- **Продолжительность**: ~1 час
- **Использование**: Отправляется на сервер в Authorization заголовке

### 2. Service Account
- **Что**: Admin credentials для Firebase Admin SDK
- **Где**: ТОЛЬКО на сервере в .env
- **Для чего**: Полный доступ к Firestore/Auth/Storage
- **Опасность**: Если утечет → полный компроментент!

### 3. Security Rules
- **Что**: Условия доступа к Firestore
- **Где**: В firestore.rules файле
- **Пример**: `allow read: if request.auth.uid == resource.data.userId`
- **Назначение**: Даже если token скомпрометирован, правила защитят

### 4. Reverse Proxy (Nginx)
- **Что**: Сервер, который перенаправляет запросы
- **Зачем**: Скрывает Node.js, работает с SSL, балансирует нагрузку
- **Конфиг**: `/etc/nginx/sites-available/default`

---

## 🚀ПРИМЕРЫ КОДА

### Регистрация (с сервера)
```javascript
// client/firebase-auth.js
await register('user@example.com', 'password123', 'John');

// Что происходит за сценами:
// 1. Создается пользователь в Firebase Auth
// 2. Получается ID Token
// 3. Отправляется POST /api/register с токеном
// 4. Сервер проверяет токен и создает профиль в Firestore
```

### Получить свои уроки
```javascript
// client/firebase-auth.js
const lessons = await getMyLessons();

// Что происходит:
// 1. Отправляется GET /api/lessons с ID Token
// 2. Сервер проверяет token (verifyToken middleware)
// 3. Запрашивает Firestore: WHERE userId == user.uid
// 4. Firestore проверяет Security Rules
// 5. Возвращает только уроки с userId == request.auth.uid
```

### Создать урок
```javascript
// client/firebase-auth.js
await createLesson('Мой урок', 'Содержание...');

// Сервер:
// 1. Проверяет token
// 2. Добавляет в Firestore: { title, content, userId: req.user.uid, ... }
// 3. userId ВСЕГДА равен текущему пользователю (нельзя подделать!)
```

---

## 🆗 ПРОВЕРКА: ВСЕ ЛИ ПРАВИЛЬНО?

Запусти этот чек-лист:

```bash
# На компьютере
ls -la server/.env                    # Должно быть: локально
grep -r "TELEGRAM_" server/           # ❌ НЕ ДОЛЖНО БЫТЬ вне .env
grep -r "service_account" server/    # ❌ НЕ ДОЛЖНО БЫТЬ вне .env

# На VPS
ssh root@твой-домен
ls -la /opt/uzdarus-api/.env           # Должно быть: -rw------- root root
pm2 status                              # Должно быть: online
curl http://localhost:3000/health      # Должно быть: {"status":"ok"}
curl -I https://твой-домен.com/        # Должно быть: 200 OK HTTPS
ufw status                              # Должно быть: active

# Firestore
firebase deploy --only firestore:rules --dry-run  # Должно пройти без ошибок
```

---

## 📞 КОГДА ПРОСИТЬ ПОМОЩЬ

Если что-то не работает, собери эту информацию:

```bash
# На VPS
pm2 logs uzdarus-api --lines 50
tail -f /var/log/nginx/error.log
curl -I https://твой-домен.com/health

# Локально
npm start  # какая ошибка?
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{"email":"test@test.com"}'
```

---

## 🎬ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- 📖 [Firebase Documentation](https://firebase.google.com/docs)
- 🐧 [Ubuntu Security](https://ubuntu.com/security)
- 🔒 [Node.js Security Checklist](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- 📚 [Nginx Docs](https://nginx.org/en/docs/)
- 🔑 [Let's Encrypt](https://letsencrypt.org/)
- ⚙️ [PM2 Documentation](https://pm2.keymetrics.io/)

---

## ✨ИТОГО

| Этап | Статус |
|------|--------|
| 🔍 Анализ проблем | ✅ DONE ([SECURE_SETUP.md](SECURE_SETUP.md)) |
| 🏗️ Архитектура | ✅ DONE ([ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)) |
| 🚀 Быстрый старт | ✅ DONE ([QUICK_START.md](QUICK_START.md)) |
| 🐧 Ubuntu развертывание | ✅ DONE ([UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md)) |
| 🔐 Безопасность | ✅ DONE ([SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)) |
| 💻 Код API | ✅ DONE ([server/src/api.js](server/src/api.js)) |
| 🎨 Фронтенд | ✅ DONE ([client/firebase-auth.js](client/firebase-auth.js)) |
| 🌐 Nginx конфиг | ✅ DONE ([nginx-config.example](nginx-config.example)) |
| 🔧 Firestore Rules | ✅ DONE ([firestore.rules](firestore.rules)) |

**🎉 ВСЕ ГОТОВО! НАЧНИ С [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)**
