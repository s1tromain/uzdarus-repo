// 🔐 БЕЗОПАСНЫЙ ФРОНТЕНД КОД
// Сохрани в: /client/firebase-auth.js
// Использует Firebase Web SDK + ID Token для защиты

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ===== FIREBASE CONFIG (Это ПУБЛИЧНЫЙ ключ, ОК для фронтенда) =====
const firebaseConfig = {
    apiKey: "AIzaSyB_0gyDPwaZpMIzhP7ukpi-KTWPPAlhfTs",
    authDomain: "uzdarus-b97aa.firebaseapp.com",
    projectId: "uzdarus-b97aa",
    storageBucket: "uzdarus-b97aa.firebasestorage.app",
    messagingSenderId: "356182863532",
    appId: "1:356182863532:web:326d8e09465d86f0077909",
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ===== ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ: текущий пользователь =====
export let currentUser = null;
export let currentIdToken = null;

// ===== ОТСЛЕЖИВАНИЕ СТАТУСА АУТЕНТИФИКАЦИИ =====
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        // 🔐 Получи ID Token для отправки серверу
        currentIdToken = await user.getIdToken();
        console.log('✅ Пользователь вошел:', user.email);
    } else {
        currentIdToken = null;
        console.log('❌ Пользователь вышел');
    }
    // Обнови UI (вызови твою функцию обновления интерфейса)
    updateUI();
});

// ===== РЕГИСТРАЦИЯ =====
export async function register(email, password, name) {
    try {
        // 1️⃣ Создай пользователя в Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2️⃣ Отправь на сервер для создания профиля (сервер валидирует токен)
        const idToken = await user.getIdToken();
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` // 🔐 Токен в заголовке
            },
            body: JSON.stringify({ email, name })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        console.log('✅ Регистрация успешна');
        return data;
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error.message);
        throw error;
    }
}

// ===== ВХОД =====
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Вход успешен');
        return userCredential.user;
    } catch (error) {
        console.error('❌ Ошибка входа:', error.message);
        throw error;
    }
}

// ===== ВЫХОД =====
export async function logout() {
    try {
        await firebaseSignOut(auth);
        currentUser = null;
        currentIdToken = null;
        console.log('✅ Выход выполнен');
    } catch (error) {
        console.error('❌ Ошибка выхода:', error.message);
    }
}

// ===== ЗАЩИЩЕННЫЙ ЗАПРОС К API (с токеном) =====
export async function apiCall(endpoint, method = 'GET', body = null) {
    if (!currentIdToken) {
        throw new Error('Пользователь не аутентифицирован');
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentIdToken}` // 🔐 Токен в каждом запросе
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`/api${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API error');
    }

    return data;
}

// ===== ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ =====

// Получить профиль
export async function getUserProfile() {
    try {
        const data = await apiCall('/user/profile');
        console.log('Профиль:', data.user);
        return data.user;
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Обновить профиль
export async function updateUserProfile(name, bio) {
    try {
        const data = await apiCall('/user/profile', 'PUT', { name, bio });
        console.log('✅ Профиль обновлен');
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Получить мои уроки
export async function getMyLessons() {
    try {
        const data = await apiCall('/lessons');
        console.log('Мои уроки:', data.lessons);
        return data.lessons;
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Создать урок
export async function createLesson(title, content) {
    try {
        const data = await apiCall('/lessons', 'POST', { title, content });
        console.log('✅ Урок создан с ID:', data.id);
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Отправить контактную форму
export async function sendContactForm(name, email, message) {
    try {
        const response = await apiCall('/send-contact', 'POST', { 
            name, 
            email, 
            message 
        });
        console.log('✅ Сообщение отправлено');
        return response;
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        throw error;
    }
}

// ===== UI UPDATE FUNCTION (измени под свой сайт) =====
function updateUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userSection = document.getElementById('user-section');

    if (currentUser) {
        authButtons?.style.display = 'none';
        if (userSection) {
            userSection.innerHTML = `
                <p>Добро пожаловать, ${currentUser.email}</p>
                <button onclick="logout()">Выход</button>
            `;
        }
    } else {
        authButtons?.style.display = 'block';
        if (userSection) userSection.innerHTML = '';
    }
}

// ===== ЭКСПОРТ =====
export default {
    register,
    login,
    logout,
    apiCall,
    getUserProfile,
    updateUserProfile,
    getMyLessons,
    createLesson,
    sendContactForm
};
