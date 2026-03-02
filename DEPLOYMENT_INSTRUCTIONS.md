# 🚀 ИНСТРУКЦИЯ ПО РАЗВЕРТЫВАНИЮ НА СЕРВЕРЕ

## 📋 Данные сервера
- **IP:** 188.137.183.24
- **Пользователь:** root
- **Пароль:** bz\FVx88}\C43Fk

## 🔧 ЭТАП 1: Подключение и установка базы

Подключись к серверу через SSH/Terminal:
```bash
ssh root@188.137.183.24
# Введи пароль: bz\FVx88}\C43Fk
```

### 1.1 Обнови систему
```bash
apt-get update && apt-get upgrade -y
```

### 1.2 Установи Node.js и npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs nginx git
```

### 1.3 Установи PM2 для автозапуска
```bash
npm install -g pm2
```

## 📦 ЭТАП 2: Развертывание проекта

### 2.1 Создай директорию проекта
```bash
mkdir -p /var/www/uzdarus
cd /var/www/uzdarus
```

### 2.2 Загрузи проект через git или SFTP

**Вариант А: Если есть GitHub репозиторий**
```bash
git clone <твой-репозиторий> .
```

**Вариант Б: Через SFTP** (с локального компьютера)
```powershell
# На локальном компьютере:
scp -r "C:\Users\johnc\Desktop\uzdarus.test — копия\*" root@188.137.183.24:/var/www/uzdarus/
scp "C:\Users\johnc\Desktop\uzdarus.test — копия\server\.env" root@188.137.183.24:/var/www/uzdarus/server/
```

### 2.3 Установи зависимости
```bash
cd /var/www/uzdarus/server
npm install
```

## ⚙️ ЭТАП 3: Настройка Nginx (реверс-прокси)

### 3.1 Создай конфигурацию Nginx
```bash
sudo nano /etc/nginx/sites-available/uzdarus
```

Вставь это содержимое:
```nginx
# HTTP Server - пока без SSL
server {
    listen 80;
    listen [::]:80;
    server_name 188.137.183.24;

    # Логи
    access_log /var/log/nginx/uzdarus_access.log;
    error_log /var/log/nginx/uzdarus_error.log;

    # ========== ФРОНТЕНД (статические файлы) ==========
    location / {
        root /var/www/uzdarus;
        index index.html;
        
        # Если файл не найден, иди на index.html (для SPA)
        try_files $uri $uri/ /index.html;
    }

    # ========== API - ПРОКСИ НА NODE.JS ==========
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        
        # Заголовки для проксирования
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket поддержка
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # ========== ЗДОРОВЬЕ ==========
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

### 3.2 Активируй конфигурацию
```bash
sudo ln -s /etc/nginx/sites-available/uzdarus /etc/nginx/sites-enabled/
sudo nginx -t  # Проверка синтаксиса
sudo systemctl restart nginx
```

## 🎯 ЭТАП 4: Запуск Node.js сервера

### 4.1 Запусти Node.js через PM2
```bash
cd /var/www/uzdarus/server
pm2 start server.js --name "uzdarus-api"
pm2 save
pm2 startup  # Сохрани для автозапуска при перезагрузке
```

### 4.2 Проверь логи
```bash
pm2 logs uzdarus-api
```

## 🧪 ЭТАП 5: Тестирование

### 5.1 Проверь здоровье API
```bash
curl http://188.137.183.24/health
# Должно вернуть: {"status":"ok","timestamp":"..."}
```

### 5.2 Тестирование контактной формы
```bash
curl -X POST http://188.137.183.24/api/send-contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Hello"}'
```

### 5.3 Открой в браузере
```
http://188.137.183.24
```

Заполни контактную форму и проверь логирует ли она в Telegram.

## 🔒 ЭТАП 6: SSL/HTTPS (рекомендуется)

### 6.1 Установи Certbot для Let's Encrypt
```bash
apt-get install -y certbot python3-certbot-nginx
```

### 6.2 Получи сертификат (если есть домен)
```bash
sudo certbot --nginx -d твой-домен.com -d www.твой-домен.com
```

## 📊 Полезные команды PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs uzdarus-api

# Перезагрузка
pm2 restart uzdarus-api

# Остановка
pm2 stop uzdarus-api

# Удаление
pm2 delete uzdarus-api
```

## 🚨 Решение проблем

### Проблема: CORS блокировка
**Решение:** Убедись что обновил index.html на относительные пути `/api/...` вместо `http://localhost:3000/api/...`

### Проблема: API не отвечает
**Решение:**
```bash
# Проверь статус Node.js
pm2 status
pm2 logs uzdarus-api  # Смотри ошибки

# Проверь работает ли localhost:3000
curl http://localhost:3000/health
```

### Проблема: Telegram не получает сообщения
**Решение:**
1. Проверь что `.env` файл содержит правильные токены
2. Смотри логи: `pm2 logs uzdarus-api`
3. Проверь правильность формата токенов и chat_id

---

**Готово!** Приложение должно быть доступно на http://188.137.183.24 ✅
