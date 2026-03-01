// 🔐 НОВЫЙ БЕЗОПАСНЫЙ API
// /server/src/api.js
// Запускай: node src/api.js (или через PM2)

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config(); // Загрузи переменные из .env

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: ['https://твой-домен.com', 'http://localhost:3000'], // ТОЛЬКО твои домены!
    credentials: true
}));
app.use(express.json());

// ===== FIREBASE ADMIN INIT =====
// Service Account ключ загружаем из .env
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();

// ===== MIDDLEWARE: Проверка Firebase ID Token =====
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const idToken = authHeader.substring(7); // Убери "Bearer "

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Доступ к uid, email и т.д.
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ===== ПУБЛИЧНЫЕ ENDPOINTS (без токена) =====

// Проверка здоровья сервера
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Регистрация
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // Создай пользователя в Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        // Сохрани дополнительные данные в Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email,
            name,
            uid: userRecord.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            role: 'student', // По умолчанию
        });

        res.json({ success: true, uid: userRecord.uid });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// ===== ЗАЩИЩЕННЫЕ ENDPOINTS (нужен Firebase ID Token) =====

// Получить профиль пользователя
app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user: userDoc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновить профиль (только свой!)
app.put('/api/user/profile', verifyToken, async (req, res) => {
    const { name, bio } = req.body;

    try {
        await db.collection('users').doc(req.user.uid).update({
            name,
            bio,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отправить сообщение контактной формы через Telegram
app.post('/api/send-contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields required' });
    }

    try {
        const telegramToken = process.env.TELEGRAM_CONTACT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CONTACT_CHAT_ID;

        const text = `📩 *Новое сообщение*\n\n👤 *Имя:* ${name}\n📧 *Email:* ${email}\n📝 *Текст:* ${message}`;

        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            throw new Error('Telegram API error');
        }

        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        console.error('Telegram error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Получить мои учебные материалы (только свои, защищено verifyToken)
app.get('/api/lessons', verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection('lessons')
            .where('userId', '==', req.user.uid) // 🔒 ТОЛЬКО СВОИ ДАННЫЕ!
            .orderBy('createdAt', 'desc')
            .get();

        const lessons = [];
        snapshot.forEach(doc => {
            lessons.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, lessons });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создать новый урок (только свой, защищено verifyToken)
app.post('/api/lessons', verifyToken, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content required' });
    }

    try {
        const docRef = await db.collection('lessons').add({
            title,
            content,
            userId: req.user.uid, // 🔒 ПРИВЯЗКА К ПОЛЬЗОВАТЕЛЮ
            email: req.user.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 API запущен на localhost:${PORT}`);
    console.log(`🔒 Firebase Admin подключен`);
    console.log(`📝 NODE_ENV: ${process.env.NODE_ENV}`);
});
