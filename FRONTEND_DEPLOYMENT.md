# Инструкция: Обновление фронтенда после деплоя на Render

## Шаг 1: Загрузить Render URL сервера

После деплоя сервера на Render вы получите URL типа:
```
https://uzdarus-api.onrender.com
```

## Шаг 2: Обновить все API вызовы

Найти все `fetch('http://localhost:3000` и заменить на Render URL.

### Файлы для обновления:
1. **tolov.html** (строка ~1010)
2. **index.html** (строка ~1502)
3. **Другие HTML файлы** с API вызовами

### Поиск и замена

**В VS Code:**
1. Открыть Find & Replace: `Ctrl+H`
2. Найти: `http://localhost:3000`
3. Заменить на: `https://uzdarus-api.onrender.com`
4. Нажать "Replace All"

**Пример кода ДО:**
```javascript
const response = await fetch('http://localhost:3000/api/send-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});
```

**Пример кода ПОСЛЕ:**
```javascript
const response = await fetch('https://uzdarus-api.onrender.com/api/send-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});
```

## Шаг 3: Деплой на Netlify

1. Загрузить файлы на GitHub (если ещё не загружены)
2. Подключить репозиторий к Netlify
3. Netlify автоматически будет деплоить на каждый push

## Шаг 4: Тестирование

1. Открыть сайт на Netlify
2. Попробовать отправить платеж
3. Проверить что уведомление пришло в Telegram

## Важно! 🔐

- **НИКОГДА** не выкладывайте `.env` файл на GitHub!
- `.env` уже добавлен в `.gitignore` на бэкенде
- На Render переменные окружения добавляются через dashboard, а не через файлы

## Чек-лист

- [ ] Сервер деплоен на Render
- [ ] Получен Render URL (https://uzdarus-api.onrender.com)
- [ ] Обновлены все localhost:3000 на Render URL в HTML файлах
- [ ] Фронтенд деплоен на Netlify
- [ ] Протестирована отправка платежа
- [ ] Telegram уведомление пришло в чат
