# 🔐 Безопасная архитектура: Фронтенд + VPS + Firebase

## ПРОБЛЕМЫ В ТЕКУЩЕМ КОДЕ

### ❌ firebase-utils.js
```js
const firebaseConfig = {
    apiKey: "AIzaSyB_0gyDPwaZpMIzhP7ukpi-KTWPPAlhfTs",  // ✅ OK (это web key для браузера)
    ...
};
```
**Статус**: ✅ Это нормально для фронтенда, apiKey для Web не секретный.

### ❌ server/server.js
```js
const SUPABASE_URL = 'https://gwflvqqncpbpbgcerfah.supabase.co';  // ❌ ПЛОХО
const SUPABASE_KEY = 'sb_publishable_Xi7vcWA-IIWIJrElUZTQQQ_kC6Awuj5';  // ❌ ПЛОХО
const TELEGRAM_BOTS = { token: '8316080775:AAHixiWEXwaacyeq5NywMi_JdZJ_qtsbrIY' };  // ❌ ПЛОХО
```
**Проблема**: Все секреты в исходнике! Нужен `.env` файл.

### ❌ firestore.rules
```js
allow read: if true;
allow create: if true;
```
**Проблема**: ОТКРЫТО ДЛЯ ВСЕХ! Нужна проверка `auth.uid`.

---

## ✅ РЕШЕНИЕ

### Архитектура:
1. **Фронтенд**: HTML/HTTPS → отправляет Firebase ID Token
2. **API (VPS)**: Проверяет токен → вызывает Firebase Admin SDK
3. **Firebase**: Service Account (ключ только на сервере) + Security Rules с uid проверкой

### Что остается во фронтенде:
- ✅ firebaseConfig (без секретов)
- ✅ Firebase Web SDK (Auth + Firestore read)

### Что уходит на сервер:
- 🔒 Service Account JSON (Firebase Admin SDK)
- 🔒 Telegram токены
- 🔒 Database пароли
- 🔒 JWT secret (если используется)

---

## 📝 ФАЙЛЫ, КОТОРЫЕ ГЕНЕРИРУЕМ:

1. `/server/.env` - все секреты
2. `/server/.env.example` - шаблон (в гит без значений)
3. `/server/src/api.js` - новый API с Express + Firebase Admin
4. `/server/.gitignore` - исключить .env
5. `/nginx/default` - конфиг Nginx (reverse proxy + HTTPS)
6. `/firestore.rules` - Security Rules с проверкой uid
7. `/client/firebase-secure-auth.js` - новый фронтенд код (с token передачей)

---

## 🚀 СЛЕДУЙ ДАЛЬШЕ: ШАГ 2, ШАГ 3 и т.д.
