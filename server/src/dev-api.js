// 🔐 ТЕСТОВЫЙ API (без Firebase требований)
// /server/src/dev-api.js
// Для локального тестирования Telegram отправок

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Telegram токены из старого кода
const TELEGRAM_BOTS = {
    contact: {
        token: '8316080775:AAHixiWEXwaacyeq5NywMi_JdZJ_qtsbrIY',
        chatId: '8439904337'
    }
};

// ===== MIDDLEWARE =====
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost',
        'http://localhost:5500'  // Live Server extension
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== ОТПРАВИТЬ КОНТАКТНОЕ СООБЩЕНИЕ =====
app.post('/api/send-contact', async (req, res) => {
    const { name, email, message } = req.body;

    console.log('📝 Получено сообщение:', { name, email });

    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Все поля обязательны' 
        });
    }

    try {
        const telegramToken = TELEGRAM_BOTS.contact.token;
        const telegramChatId = TELEGRAM_BOTS.contact.chatId;

        const text = `📩 *Новое сообщение с сайта!*\n\n` +
            `👤 *Имя:* ${name}\n` +
            `📧 *Email:* ${email}\n` +
            `📝 *Текст:* ${message}\n\n` +
            `🕐 *Время:* ${new Date().toLocaleString('ru-RU')}`;

        console.log('📤 Отправляю в Telegram...');

        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text,
                parse_mode: 'Markdown',
            }),
        });

        const telegramResponse = await response.json();

        if (!response.ok) {
            console.error('❌ Telegram error:', telegramResponse);
            throw new Error(`Telegram API error: ${telegramResponse.description}`);
        }

        console.log('✅ Сообщение отправлено в Telegram');
        res.json({ 
            success: true, 
            message: 'Сообщение отправлено успешно!',
            telegramMessageId: telegramResponse.result.message_id 
        });
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        res.status(500).json({ 
            success: false, 
            message: `Ошибка: ${error.message}` 
        });
    }
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
🚀 DEV API запущен на http://localhost:${PORT}

✅ Доступные эндпоинты:
   GET  /health
   POST /api/send-contact

📧 Telegram токены загружены:
   Contact bot: ${TELEGRAM_BOTS.contact.token.substring(0, 10)}...
   Chat ID: ${TELEGRAM_BOTS.contact.chatId}
    `);
});
