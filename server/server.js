import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 🔐 Загрузи переменные окружения из .env файла
dotenv.config();

// Получи значения из .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:8000'];

// Telegram токены из .env
const TELEGRAM_BOTS = {
    contact: {
        token: process.env.TELEGRAM_CONTACT_TOKEN,
        chatId: process.env.TELEGRAM_CONTACT_CHAT_ID
    },
    payment: {
        token: process.env.TELEGRAM_PAYMENT_TOKEN,
        chatId: process.env.TELEGRAM_PAYMENT_CHAT_ID
    }
};

// Проверка на отсутствие критических переменных
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ОШИБКА: Не найдены SUPABASE_URL или SUPABASE_KEY в .env файле');
    process.exit(1);
}

if (!TELEGRAM_BOTS.contact.token || !TELEGRAM_BOTS.payment.token) {
    console.error('⚠️ ПРЕДУПРЕЖДЕНИЕ: Telegram токены не найдены в .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();

// 🔒 CORS: Только разрешенные домены
app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Middleware для логирования
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== 1. REGISTER =====
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Barcha maydonlar to\'ldirilishi kerak' 
        });
    }

    try {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: { name }
            }
        });

        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        return res.json({ 
            success: true, 
            user: {
                id: data.user?.id,
                email: data.user?.email
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server xatosi' 
        });
    }
});

// ===== 2. LOGIN =====
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email va parol zarur' 
        });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });

        if (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Noto\'g\'ri email yoki parol' 
            });
        }

        return res.json({ 
            success: true, 
            user: {
                id: data.user?.id,
                email: data.user?.email
            },
            session: data.session
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server xatosi' 
        });
    }
});

// ===== 3. GET USER PROFILE (requires auth) =====
app.get('/api/user/profile', async (req, res) => {
    const userId = req.headers['x-user-id']; // Получить из заголовка
    
    if (!userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Avtorizatsiya talab etiladi' 
        });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return res.status(404).json({ 
                success: false, 
                message: 'Foydalanuvchi topilmadi' 
            });
        }

        return res.json({ 
            success: true, 
            user: data 
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server xatosi' 
        });
    }
});

// ===== 4. SEND CONTACT MESSAGE =====
app.post('/api/send-contact', async (req, res) => {
    const { name, email, message } = req.body;
    
    // Валидация
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Barcha maydonlar to\'ldirilishi kerak' 
        });
    }

    // Проверка Telegram токена
    if (!TELEGRAM_BOTS.contact.token) {
        console.error('❌ Telegram contact token not configured');
        return res.status(500).json({ 
            success: false, 
            message: 'Telegram konfiguratsiyasi xatosi' 
        });
    }

    const text = `📩 *Yangi xabar UzdaRus saytidan!*\n\n` +
        `👤 *Ism:* ${name}\n` +
        `📧 *Email:* ${email}\n` +
        `📝 *Xabar:* ${message}\n\n` +
        `🕐 *Vaqt:* ${new Date().toLocaleString('uz-UZ')}`;
    
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOTS.contact.token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_BOTS.contact.chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Telegram API error: ${errorData.description}`);
        }

        const telegramResponse = await response.json();
        
        console.log('✅ Message sent to Telegram successfully');
        return res.json({ 
            success: true, 
            message: 'Xabar yuborildi',
            telegramMessageId: telegramResponse.result?.message_id
        });
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Xabar yuborilmadi. Keyinroq urinib ko\'ring' 
        });
    }
});

// ===== 5. SEND PAYMENT REQUEST =====
app.post('/api/send-payment', async (req, res) => {
    const { name, phone, email, telegram, tariff, course } = req.body;
    
    // Валидация
    if (!name || !phone || !email || !telegram || !tariff || !course) {
        return res.status(400).json({ 
            success: false, 
            message: 'Barcha maydonlar to\'ldirilishi kerak' 
        });
    }

    // Проверка Telegram токена
    if (!TELEGRAM_BOTS.payment.token) {
        console.error('❌ Telegram payment token not configured');
        return res.status(500).json({ 
            success: false, 
            message: 'Telegram konfiguratsiyasi xatosi' 
        });
    }

    const text = `🔄 *YANGI TO'LOV SO'ROVI* 🔄\n\n` +
        `👤 *Ism-Familiya:* ${name}\n` +
        `📱 *Telefon:* ${phone}\n` +
        `📧 *Email:* ${email}\n` +
        `✈️ *Telegram:* ${telegram}\n` +
        `👑 *Tarif:* ${tariff}\n` +
        `🎓 *Kurs:* ${course}\n\n` +
        `⏰ *Vaqt:* ${new Date().toLocaleString('uz-UZ')}\n` +
        `💰 *To'lov:* ${getTariffPrice(tariff)}\n` +
        `🆔 *ID:* ${Date.now()}`;
    
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOTS.payment.token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_BOTS.payment.chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Telegram API error: ${errorData.description}`);
        }

        const telegramResponse = await response.json();
        
        console.log('✅ Payment request sent to Telegram successfully');
        return res.json({ 
            success: true, 
            message: 'To\'lov so\'rovi yuborildi',
            telegramMessageId: telegramResponse.result?.message_id
        });
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'To\'lov so\'rovi yuborilmadi. Keyinroq urinib ko\'ring' 
        });
    }
});

// Helper function
function getTariffPrice(tariff) {
    switch (tariff?.toUpperCase()) {
        case 'START': return '780,000 so\'m';
        case 'GOLD': return '1,300,000 so\'m';
        case 'PLATINUM': return '1,900,000 so\'m';
        default: return 'Noma\'lum';
    }
}

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Server xatosi' 
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║  🚀 UzdaRus API Server Started       ║
╚══════════════════════════════════════╝

✅ Server running on http://localhost:${PORT}
📝 NODE_ENV: ${NODE_ENV}
🔒 CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}

🌍 Available endpoints:
   GET  /health                    - Check server status
   POST /api/register              - Register new user
   POST /api/login                 - Login user
   GET  /api/user/profile          - Get user profile
   POST /api/send-contact          - Send contact message
   POST /api/send-payment          - Send payment request

⚠️  Make sure .env file is configured!
    `);
});
