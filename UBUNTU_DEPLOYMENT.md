# 🚀 ПОШАГОВАЯ ИНСТРУКЦИЯ ДЛЯ UBUNTU 22.04

## 📋 ПОДГОТОВКА: Что тебе нужно перед началом

Получи из Firebase:
1. **Service Account JSON файл** (Firebase Console → Project Settings → Service Accounts → Generate New Private Key)
2. **Снимок значимых переменных из текущей конфигурации**

---

## ЭТАП 1: SSH на VPS и базовая настройка (5 мин)

### 1.1 Подключиться к VPS
```bash
ssh root@твой-ip-адрес-или-домен
# Введи пароль из письма хостера
```

### 1.2 Обновитьсистему
```bash
apt-get update && apt-get upgrade -y
```

### 1.3 Добавить swap (если нужно)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## ЭТАП 2: Установка Node.js и PM2 (5 мин)

### 2.1 Установить Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.2 Установить PM2 (менеджер процессов)
```bash
npm install -g pm2
pm2 version
```

### 2.3 Подготовить pm2 к автозапуску
```bash
pm2 startup
# Выполни команду, которую выведет терминал!
pm2 save
```

---

## ЭТАП 3: Установка Nginx и SSL (10 мин)

### 3.1 Установить Nginx
```bash
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

### 3.2 Получить SSL сертификат (Certbot)
```bash
apt-get install -y certbot python3-certbot-nginx

# Получи сертификат (замени на свой домен):
certbot certonly --nginx -d твой-домен.com -d www.твой-домен.com
# Выбери опцию: 1 (или 2 для автоматического редиректа)
```

### 3.3 Проверить автоматическое обновление сертификата
```bash
certbot renew --dry-run
```

---

## ЭТАП 4: Развертывание приложения (10 мин)

### 4.1 Создать директорию приложения
```bash
mkdir -p /opt/uzdarus-api
cd /opt/uzdarus-api
```

### 4.2 Загрузить файлы с Git или вручную
#### Вариант A: Через Git (если есть репозиторий)
```bash
git clone https://github.com/твой-username/uzdarus.git .
```

#### Вариант B: Вручную через SCP с локального компьютера
```bash
# На компьютере, откуда загружаешь:
scp -r ./server/* root@твой-домен:/opt/uzdarus-api/
scp -r ./config/* root@твой-домен:/opt/uzdarus-api/
```

### 4.3 Установить зависимости Node.js
```bash
cd /opt/uzdarus-api
npm install
npm install --save firebase-admin dotenv
```

### 4.4 Создать .env файл с секретами (КРИТИЧНО!)
```bash
nano /opt/uzdarus-api/.env
```

**Содержимое .env файла:**
```
NODE_ENV=production
PORT=3000

# Firebase Service Account (получи из JSON файла)
FIREBASE_PROJECT_ID=uzdarus-b97aa
FIREBASE_PRIVATE_KEY_ID=xxxxxxxxxxxxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@uzdarus-b97aa.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=xxxxxxxxxxxxxxx

# Telegram
TELEGRAM_CONTACT_TOKEN=8316080775:AAHixiWEXwaacyeq5NywMi_JdZJ_qtsbrIY
TELEGRAM_CONTACT_CHAT_ID=8439904337
TELEGRAM_PAYMENT_TOKEN=8709653363:AAHzR4xSgKIrZoe4Ue_JWrQDmM41hJjG-o0
TELEGRAM_PAYMENT_CHAT_ID=8439904337
```

### 4.5 Установить правильные права доступа на .env
```bash
chmod 600 /opt/uzdarus-api/.env
ls -la /opt/uzdarus-api/.env  # Должно быть: -rw------- root root
```

### 4.6 Запустить приложение через PM2
```bash
cd /opt/uzdarus-api
pm2 start ecosystem.config.js --env production

# Проверить статус
pm2 status
pm2 logs

# Сохранить конфиг для автозапуска
pm2 save
```

### 4.7 Проверить, что API работает
```bash
curl http://localhost:3000/health
# Должно вернуть: {"status":"ok","timestamp":"..."}
```

---

## ЭТАП 5: Настройка Nginx (10 мин)

### 5.1 Загрузить фронтенд на сервер
```bash
mkdir -p /var/www/frontend
# Загрузи HTML/CSS/JS файлы
scp -r ./frontend/* root@твой-домен:/var/www/frontend/
```

### 5.2 Создать конфиг Nginx
```bash
nano /etc/nginx/sites-available/default
```

**Вставь содержимое из файла `nginx-config.example` (в репозитории)**

### 5.3 Проверить конфиг и перезагрузить
```bash
nginx -t  # Проверка синтаксиса
systemctl reload nginx
```

### 5.4 Проверить HTTPS
```bash
curl -I https://твой-домен.com/
# Должно быть: 200 OK  + HTTPS
```

---

## ЭТАП 6: Улучшение безопасности (10 мин)

### 6.1 Включить firewall UFW
```bash
ufw enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status

# Проверить
ufw show added
```

### 6.2 Отключить SSH пароль (после настройки ключей)
```bash
nano /etc/ssh/sshd_config
# Найди строку: #PasswordAuthentication yes
# Измени на: PasswordAuthentication no
# Сохрани и перезагрузи SSH:
systemctl restart sshd
```

### 6.3 Установить и запустить Fail2Ban (защита от brute-force)
```bash
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
fail2ban-client status
```

### 6.4 Настроить логирование
```bash
mkdir -p /var/log/pm2
npm install -g pm2-logrotate
pm2 install pm2-logrotate
```

---

## ЭТАП 7: Развертывание Firestore Security Rules (5 мин)

### 7.1 Установить Firebase CLI (на компьютере)
```bash
npm install -g firebase-tools
firebase login
```

### 7.2 Обновпить firestore.rules (скопированнй файл)
```bash
firebase deploy --only firestore:rules
# Проверить в консоли Firebase
```

---

## ЭТАП 8: Проверка и мониторинг (10 мин)

### 8.1 Полный чек здоровья
```bash
# 1. Фронтенд
curl -I https://твой-домен.com
# Должно быть: 200 OK

# 2. API
curl https://твой-домен.com/health
# {"status":"ok"}

# 3. PM2
pm2 status
pm2 logs uzdarus-api

# 4. Nginx
systemctl status nginx

# 5. Firewall
ufw status

# 6. Сертификат SSL
certbot certificates
```

### 8.2 Настроить мониторинг (Opcional)
```bash
pm2 web
# Откройl http://localhost:9615 в браузере

pm2 install pm2-auto-pull  # Auto-update из гита
```

---

## 🚨 ЧЕК-ЛИСТ БЕЗОПАСНОСТИ

- [ ] .env файл создан с chmod 600
- [ ] .env добавлен в .gitignore (никогда не коммитить!)
- [ ] firebaseConfig в фронтенде БЕЗ приватного ключа
- [ ] Service Account JSON хранится ТОЛЬКО на сервере
- [ ] Telegram токены в .env, не в коде
- [ ] Firestore Rules обновлены (проверка uid)
- [ ] SSL сертификат установлен (HTTPS)
- [ ] UFW firewall включен (22, 80, 443)
- [ ] SSH пароль отключен (только ключи)
- [ ] PM2 настроен на автозапуск
- [ ] Логирование настроено
- [ ] Fail2Ban установлен

---

## 🔧ТРУБЛСУТИНГsovereign

### API не запускается
```bash
pm2 logs uzdarus-api
# Проверь ошибки
```

### SSL не работает
```bash
certbot renew
systemctl restart nginx
```

### Node.js потребляет много памяти
```bash
pm2 stop uzdarus-api
pm2 start uzdarus-api --max-memory-restart 500M
```

### Файлы .env потеряюлись
```bash
# Восстанови из .env.example и заполни значения
cp /opt/uzdarus-api/.env.example /opt/uzdarus-api/.env
nano /opt/uzdarus-api/.env
chmod 600 /opt/uzdarus-api/.env
pm2 restart uzdarus-api
```

---

## 📞 ПОМОЩЬ

Для версионирования: `git log --oneline`
Для скорости: `top`, `htop` или `pm2 monitor`
