// js/telegram-auth.js
// Модуль для інтеграції авторизації через Telegram WebApp

const API_URL = 'https://api.icetown.app'; // Замініть на актуальну URL вашого API

/**
 * Ініціалізація Telegram WebApp і авторизація користувача
 * @returns {Promise<Object>} Дані користувача та токен
 */
async function initTelegramAuth() {
  return new Promise((resolve, reject) => {
    try {
      // Перевіряємо наявність Telegram WebApp
      if (!window.Telegram || !window.Telegram.WebApp) {
        console.warn('Telegram WebApp не доступний. Можливо, запущено не в Telegram.');
        return reject(new Error('Telegram WebApp не доступний'));
      }

      const tgWebApp = window.Telegram.WebApp;
      
      // Повідомляємо Telegram WebApp, що ми готові
      tgWebApp.ready();
      
      // Розширюємо WebApp на весь екран
      tgWebApp.expand();
      
      // Отримуємо дані користувача
      const userData = tgWebApp.initDataUnsafe.user;
      
      if (!userData) {
        console.warn('Дані користувача недоступні в Telegram WebApp');
        return reject(new Error('Дані користувача недоступні'));
      }
      
      console.log('Telegram user data:', userData);
      
      // Синхронізуємо користувача з сервером
      syncUserWithServer(userData)
        .then(response => {
          // Зберігаємо токен та дані користувача
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userData', JSON.stringify(response.user));
          localStorage.setItem('userProgress', JSON.stringify(response.progress || {}));
          
          // Підписуємося на події Telegram WebApp
          setupTelegramEventListeners(tgWebApp);
          
          resolve(response);
        })
        .catch(error => {
          console.error('Помилка синхронізації з сервером:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Помилка ініціалізації Telegram auth:', error);
      reject(error);
    }
  });
}

/**
 * Синхронізація даних користувача з сервером
 * @param {Object} userData - Дані користувача з Telegram
 * @returns {Promise<Object>} Відповідь сервера
 */
async function syncUserWithServer(userData) {
  try {
    const response = await fetch(`${API_URL}/api/users/sync-telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Помилка синхронізації: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Помилка синхронізації з сервером:', error);
    throw error;
  }
}

/**
 * Налаштування слухачів подій Telegram WebApp
 * @param {Object} tgWebApp - Об'єкт Telegram WebApp
 */
function setupTelegramEventListeners(tgWebApp) {
  // Подія закриття WebApp
  tgWebApp.onEvent('viewportChanged', () => {
    console.log('Viewport змінено');
  });
  
  // Обробка натискання кнопки "Назад" (якщо доступна)
  tgWebApp.BackButton.onClick(() => {
    // Можна реалізувати власну логіку повернення на попередній екран
    console.log('Натиснуто кнопку "Назад" в Telegram WebApp');
  });

  // Обробка основного кнопки (якщо використовується)
  tgWebApp.MainButton.onClick(() => {
    console.log('Натиснуто основну кнопку в Telegram WebApp');
  });
  
  // Реагування на кольорову схему
  if (tgWebApp.colorScheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.add('light-theme');
  }
  
  // Інші події можна додати за необхідності
}

/**
 * Отримання поточного токену авторизації
 * @returns {string|null} Токен авторизації або null
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Отримання даних поточного користувача
 * @returns {Object|null} Дані користувача або null
 */
function getCurrentUser() {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

/**
 * Отримання прогресу поточного користувача
 * @returns {Object|null} Прогрес користувача або null
 */
function getUserProgress() {
  const progress = localStorage.getItem('userProgress');
  return progress ? JSON.parse(progress) : null;
}

/**
 * Оновлення прогресу користувача
 * @param {Object} newProgress - Новий прогрес користувача
 */
function updateUserProgress(newProgress) {
  localStorage.setItem('userProgress', JSON.stringify(newProgress));
}

/**
 * Перевірка, чи авторизований користувач
 * @returns {boolean} Чи авторизований користувач
 */
function isAuthenticated() {
  return !!getAuthToken() && !!getCurrentUser();
}

/**
 * Відправка API запиту з токеном авторизації
 * @param {string} endpoint - Ендпоінт API
 * @param {Object} options - Опції запиту fetch
 * @returns {Promise<Object>} Результат запиту
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Відсутній токен авторизації');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Помилка запиту: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Збереження прогресу користувача на сервері
 * @param {Object} progressData - Дані прогресу для збереження
 * @returns {Promise<Object>} Оновлений прогрес
 */
async function saveUserProgress(progressData) {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Користувач не авторизований');
  }
  
  // Додаємо ID користувача до даних прогресу
  const data = {
    ...progressData,
    user_id: user.user_id
  };
  
  const result = await fetchWithAuth('/api/users/progress/save', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  // Оновлюємо локальний прогрес
  updateUserProgress(result);
  
  return result;
}

/**
 * Завершення сесії користувача
 */
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('userProgress');
  
  // Закриваємо Telegram WebApp, якщо доступно
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.close();
  }
}

// Експорт API
export default {
  initTelegramAuth,
  getAuthToken,
  getCurrentUser,
  getUserProgress,
  updateUserProgress,
  isAuthenticated,
  fetchWithAuth,
  saveUserProgress,
  logout
};