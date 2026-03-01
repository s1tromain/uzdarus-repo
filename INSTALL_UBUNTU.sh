#!/bin/bash
# 🔐 Полная установка безопасной архитектуры на Ubuntu 22.04
# Выполняй строка за строкой в терминале VPS

set -e

echo "📦 ШАГ 1: Обновление системы..."
sudo apt-get update
sudo apt-get upgrade -y

echo "📦 ШАГ 2: Установка Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "📦 ШАГ 3: Установка PM2 (для автозапуска)..."
sudo npm install -g pm2

echo "📦 ШАГ 4: Установка Nginx..."
sudo apt-get install -y nginx

echo "📦 ШАГ 5: Установка Certbot (для HTTPS)..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "📦 ШАГ 6: Установка UFW (firewall)..."
sudo apt-get install -y ufw

echo "✅ Базовая установка завершена!"
echo ""
echo "📋 ДАЛЬШЕ (вручную):"
echo "1. Загрузи service account JSON с Firebase"
echo "2. Скопируй конфиги из папок: /server /nginx"
echo "3. Создай .env файл"
echo "4. Настрой Nginx"
echo "5. Запусти приложение"
