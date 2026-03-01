import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gwflvqqncpbpbgcerfah.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xi7vcWA-IIWIJrElUZTQQQ_kC6Awuj5';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({ email, password }, { data: { name } });

    if (error) {
        return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, user: data.user });
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return res.status(401).json({ success: false, message: error.message });
    }

    res.json({ success: true, user: data.user });
});

// 3. GET ALL USERS
app.get('/api/users', async (req, res) => {
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

    res.json(data);
});

// 4. TELEGRAM NOTIFICATIONS (SECURE)
// ВАЖНО: Токены хранятся на сервере, не в клиенте!
const TELEGRAM_BOTS = {
    contact: {
        token: '8316080775:AAHixiWEXwaacyeq5NywMi_JdZJ_qtsbrIY',
        chatId: '8439904337'
    },
    payment: {
        token: '8709653363:AAHzR4xSgKIrZoe4Ue_JWrQDmM41hJjG-o0',
        chatId: '8439904337'
    }
};

// Send contact form message
app.post('/api/send-contact', async (req, res) => {
    const { name, email, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Все поля обязательны' });
    }
    
    const text = `📩 *Yangi xabar Ruschasiga saytidan!*\n\n` +
        `👤 *Ism:* ${name}\n` +
        `📧 *Email:* ${email}\n` +
        `📝 *Xabar:* ${message}\n\n` +
        `🕐 *Vaqt:* ${new Date().toLocaleString('uz-UZ')}`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOTS.contact.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_BOTS.contact.chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
        
        if (!response.ok) {
            throw new Error('Telegram API error');
        }
        
        res.json({ success: true, message: 'Xabar yuborildi' });
    } catch (error) {
        console.error('Telegram error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
});

// Send payment notification
app.post('/api/send-payment', async (req, res) => {
    const { name, phone, email, telegram, tariff, course } = req.body;
    
    // Validation
    if (!name || !phone || !email || !telegram || !tariff || !course) {
        return res.status(400).json({ success: false, message: 'Все поля обязательны' });
    }
    
    const text = `🔄 *YANGI TO'LOV SO'ROVI* 🔄\n\n` +
        `👤 *Ism-Familiya:* ${name}\n` +
        `📱 *Telefon:* ${phone}\n` +
        `📧 *Email:* ${email}\n` +
        `✈️ *Telegram:* ${telegram}\n` +
        `👑 *Tarif:* ${tariff}\n` +
        `🎓 *Kurs:* ${course}\n\n` +
        `⏰ *Vaqt:* ${new Date().toLocaleString('uz-UZ')}\n` +
        `💰 *To'lov summasi:* ${getTariffPrice(tariff)}\n` +
        `🆔 *ID:* ${Date.now()}`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOTS.payment.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_BOTS.payment.chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
        
        if (!response.ok) {
            throw new Error('Telegram API error');
        }
        
        res.json({ success: true, message: 'To\'lov so\'rovi yuborildi' });
    } catch (error) {
        console.error('Telegram error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
});

function getTariffPrice(tariff) {
    switch (tariff) {
        case 'START': return '780,000 so\'m';
        case 'GOLD': return '1,300,000 so\'m';
        case 'PLATINUM': return '1,900,000 so\'m';
        default: return 'Noma\'lum';
    }
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
