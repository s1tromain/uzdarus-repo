# 🔐 ЧЕКЛИСТ БЕЗОПАСНОСТИ И РОТАЦИЯ КЛЮЧЕЙ

## ✅ НА ЭТАПЕ РАЗРАБОТКИ

### Фронтенд (client/)
- [ ] `firebaseConfig` ТОЛЬКО с публичными данными (apiKey, projectId и т.д.)
- [ ] НЕТ Service Account JSON, приватных ключей, API секретов
- [ ] НЕТ токенов (Telegram, JWT, API tokens) в коде
- [ ] Все запросы к чувствительным эндпоинтам отправляют ID Token в заголовке

### Backend (server/)
- [ ] `.env` файл создан и в `.gitignore`
- [ ] Все секреты в переменных окружения, не в коде
- [ ] `package.json` содержит `firebase-admin`, `dotenv`
- [ ] `api.js` проверяет Firebase ID Token в каждом защищенном эндпоинте
- [ ] `.env.example` создан без значений (для гита)

### Security Rules
- [ ] `firestore.rules` проверяет `request.auth.uid == userId`
- [ ] Для коллекций нет `allow read: if true` или `allow write: if true`
- [ ] Админские действия требуют проверки роли

---

## ✅ НА ЭТАПЕ РАЗВЕРТЫВАНИЯ (Ubuntu)

### Файловая система
- [ ] `/opt/uzdarus-api/.env` имеет права `chmod 600` (-rw-------)
- [ ] `/opt/uzdarus-api/.env` принадлежит пользователю `pm2` или `ubuntu`
- [ ] `/var/www/frontend` только для чтения (644 для файлов, 755 для директорий)
- [ ] Service Account JSON НЕ в публичной директории

### Node.js / PM2
- [ ] `pm2 startup` вызван и сохранен (`pm2 save`)
- [ ] `NODE_ENV=production` установлен в `.env`
- [ ] `ecosystem.config.js` использует `exec_mode: 'cluster'` для масштабирования
- [ ] Логи сохраняются в `/var/log/pm2/`

### Nginx
- [ ] SSL сертификат установлен (Certbot Let's Encrypt)
- [ ] HTTP (80) редиректит на HTTPS (443)
- [ ] Заголовки безопасности добавлены:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
- [ ] Обратный прокси настроен: `/api` → `http://localhost:3000`

### Firewall (UFW)
- [ ] SSH (22) — только с ключом (не пароль)
- [ ] HTTP (80) — открыт для редиректа на HTTPS
- [ ] HTTPS (443) — открыт
- [ ] Остальные порты закрыты (`ufw default deny incoming`)

### Мониторинг
- [ ] `pm2 logs` проверяет ошибки регулярно
- [ ] Настроено логирование в `/var/log/pm2/`
- [ ] Nginx логи отслеживаются (`/var/log/nginx/`)

---

## 🔑 РОТАЦИЯ КЛЮЧЕЙ (когда и как)

### 1. Firebase Service Account (Квартально)

**Когда:**
- Каждые 90 дней
- После подозрения на компрометацию
- При смене команды


**Как:**
```bash
# 1. В Firebase Console: Project Settings → Service Accounts
# 2. Generate New Private Key (старую удалить)
# 3. Скачать новый JSON файл

# 4. На VPS обновить .env:
ssh root@твой-домен
nano /opt/uzdarus-api/.env
# Замени FIREBASE_PRIVATE_KEY, FIREBASE_PRIVATE_KEY_ID, FIREBASE_CLIENT_EMAIL

# 5. Перезагрузить приложение:
pm2 restart uzdarus-api
chmod 600 /opt/uzdarus-api/.env
```

### 2. Telegram Bots (При утечке)

**Когда:**
- Если кто-то узнал токен
- Если бот отправляет спам


**Как:**
```bash
# 1. В Telegram: @BotFather → /token → выбери бота
# 2. Скопируй новый токен
# 3. На VPS:
ssh root@твой-домен
nano /opt/uzdarus-api/.env
# Заменти TELEGRAM_*_TOKEN

# 4. Перезагрузить:
pm2 restart uzdarus-api
```

### 3. SSL Сертификат Let's Encrypt (Автоматический)

**Когда:** Каждые 90 дней (автоматически Certbot)

**Проверка:**
```bash
certbot certificates
certbot renew --dry-run
```

### 4. JWT Secret (если используется) (Ежегодно)

**Когда:** При любых подозрениях на утечку

**Как:**
```bash
# 1. Генерируй новый ключ:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. На VPS:
nano /opt/uздarus-api/.env
# Замени JWT_SECRET

# 3. Перезагрузить:
pm2 restart uzdarus-api

# 4. Все существующие токены перестанут работать (пользователи переживут)
```

### 5. Database Пароли (При утечке)

**Как:**
```bash
# 1. Измени пароль в БД (PostgreSQL, MySQL и т.д.)
# 2. Обнови DATABASE_URL в .env:
nano /opt/uzdarus-api/.env

# 3. Перезагрузить:
pm2 restart uzdarus-api
```

### 6. SSH Ключи (Ежегодно)

**Как:**
```bash
# На компьютере:
ssh-keygen -t ed25519 -f ~/.ssh/vps_new_key

# Загрузить новый публичный ключ на VPS:
ssh-copy-id -i ~/.ssh/vps_new_key.pub root@твой-домен

# Отключить старый ключ на VPS:
ssh -i ~/.ssh/vps_new_key root@твой-домен
nano ~/.ssh/authorized_keys
# Удали старую строку

# Тестируй:
ssh -i ~/.ssh/vps_new_key root@твой-домен
```

---

## 🔐 ХРАНЕНИЕ ТОКЕНОВ В БРАУЗЕРЕ

⚠️ **НИКОГДА НЕ СОХРАНЯЙ:**
- Service Account JSON
- Приватные ключи Firebase
- JWT Secret
- API ключи для сервис-сервис коммуникации

✅ **МОЖНО СОХРАНИТЬ (временно):**
- Firebase ID Token (в памяти, не localStorage)
  ```js
  currentIdToken = await user.getIdToken();
  // Храни в переменной, не на диске!
  ```
- Refresh Token (зашифрованный для автоматических обновлений)

---

## 🛡️ ДОПОЛНИТЕЛЬНЫЕ МЕРЫ БЕЗОПАСНОСТИ

### 1. Шифрование данных в БД
```sql
-- Храни чувствительные данные зашифрованными
CREATE EXTENSION pgcrypto;
INSERT INTO users (email, password) VALUES 
('user@example.com', pgp_sym_encrypt('password', 'secret_key'));
```

### 2. Rate Limiting на API
```js
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит 100 запросов за 15 минут
});
app.use('/api/', limiter);
```

### 3. CORS Вайтлист
```js
// Только твой домен!
app.use(cors({
  origin: ['https://твой-домен.com'],
  credentials: true
}));
```

### 4. CSP Header (Content Security Policy)
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://www.gstatic.com/firebasejs/; img-src 'self' data:" always;
```

### 5. Регулярные резервные копии
```bash
# Cron job для ежедневной резервной копии Firestore
0 2 * * * /usr/local/bin/firestore-backup.sh
```

---

## 📊 ТАБЛИЦА ЖИЗНЕННОГО ЦИКЛА КЛЮЧЕЙ

| Ключ | Где хранится | Ротация | Действие при утечке |
|------|--------------|---------|---------------------|
| firebaseConfig | Frontend (public) | Никогда | Ничего (публичный) |
| Service Account JSON | Server .env (chmod 600) | 90 дней | Немедленно |
| Telegram Token | Server .env (chmod 600) | 30 дней | Немедленно |
| SSL Certbot | /etc/letsencrypt | 90 дней | Автоматический renew |
| JWT Secret | Server .env (chmod 600) | 365 дней | Немедленно |
| SSH Key | ~/.ssh (chmod 600) | 365 дней | Заменить в authorized_keys |
| Database Password | Server .env (chmod 600) | 90 дней | Немедленно |
| Firebase ID Token | Browser Memory | 1 час | Автоматический refresh |

---

## 🚨ЧТО ИСКАТЬ В ЛОГАХ (красные флаги)

### /var/log/pm2/error.log
```
❌ Firebase: Invalid Service Account
❌ EACCES: permission denied .env
❌ Token verification failed
❌ Unauthorized: Missing Bearer token
```

### /var/log/nginx/error.log
```
❌ Connection refused (API не запущен)
❌ SSL certificate problem (Certbot не обновился)
❌ 401 Unauthorized (токен невалидный)
❌ 403 Forbidden (CORS опция запрещена)
```

### pm2 logs
```bash
pm2 logs | grep ERROR
pm2 logs uzdarus-api --err
```

---

## 📝ГОТОвЫЙ СКРИПТ ДЛЯ РОТАЦИИ КЛЮЧЕЙ

```bash
#!/bin/bash
# rotate-keys.sh - автоматическая ротация ключей

set -e

echo "🔄 Начинаем ротацию ключей..."

# Backup текущего .env
cp /opt/uzdarus-api/.env /opt/uzdarus-api/.env.backup.$(date +%Y%m%d)
echo "✅ Бэкап создан"

# Остановить приложение
pm2 stop uzdarus-api
echo "✅ Приложение остановлено"

# Обновить ключи (интерактивно)
nano /opt/uздarus-api/.env
chmod 600 /opt/uzdarus-api/.env

# Запустить приложение
pm2 start uzdarus-api
pm2 save
echo "✅ Приложение перезагружено"

# Логирование
echo "Ротация ключей выполнена: $(date)" >> /var/log/key-rotation.log

pm2 logs uzdarus-api
```

**Использование:**
```bash
chmod +x rotate-keys.sh
./rotate-keys.sh
```

---

## 🎯ИТОГО: ГЛАВНЫЕ ПРАВИЛА

1. **Никогда** не коммитьте `.env`
2. **Всегда** используй `chmod 600` для файлов с секретами
3. **Проверяй** токены в заголовке `Authorization: Bearer <token>`
4. **Ротируй** ключи каждые 30-90 дней
5. **Логируй** все критические события
6. **Бэкапи** перед любыми изменениями
7. **Мониторь** `pm2 logs` на предмет ошибок
8. **Обновляй** зависимости регулярно (`npm audit fix`)
