// js/app.js
// Головний файл клієнтського додатку Ice Town

import telegramAuth from './telegram-auth.js';

// Стан програми
let appState = {
  isAuthenticated: false,
  user: null,
  userProgress: null,
  isInitializing: true
};

// DOM Elements
const gameUI = document.getElementById('game-ui');
const loadingScreen = document.getElementById('loading-screen');
const errorScreen = document.getElementById('error-screen');
const errorMessage = document.getElementById('error-message');
const retryButton = document.getElementById('retry-button');
const userInfoEl = document.getElementById('user-info');

/**
 * Ініціалізація додатка
 */
async function initApp() {
  try {
    console.log('Ініціалізація додатка...');
    
    // Показуємо екран завантаження
    showLoading(true);
    
    // Перевіряємо, чи є збережені дані авторизації
    if (telegramAuth.isAuthenticated()) {
      console.log('Виявлено збережену сесію, продовжуємо...');
      appState.isAuthenticated = true;
      appState.user = telegramAuth.getCurrentUser();
      appState.userProgress = telegramAuth.getUserProgress();
      
      // Оновлюємо UI
      updateUIWithUserData();
      
      // Показуємо основний інтерфейс гри
      showGameUI();
      
      // Ініціалізуємо гру
      initGame();
    } else {
      console.log('Сесія не знайдена, авторизуємося через Telegram...');
      
      // Ініціалізуємо авторизацію через Telegram
      const authResult = await telegramAuth.initTelegramAuth();
      
      // Зберігаємо дані користувача
      appState.isAuthenticated = true;
      appState.user = authResult.user;
      appState.userProgress = authResult.progress;
      
      // Оновлюємо UI
      updateUIWithUserData();
      
      // Показуємо основний інтерфейс гри
      showGameUI();
      
      // Ініціалізуємо гру
      initGame();
    }
  } catch (error) {
    console.error('Помилка ініціалізації додатка:', error);
    
    // Показуємо помилку
    showError('Не вдалося підключитися до сервера або авторизуватися в Telegram. Будь ласка, спробуйте знову.');
  } finally {
    // Завершуємо ініціалізацію
    appState.isInitializing = false;
  }
}

/**
 * Оновлення UI з даними користувача
 */
function updateUIWithUserData() {
  if (!appState.user) return;
  
  // Оновлюємо інформацію про користувача
  userInfoEl.textContent = `@${appState.user.username || 'player'}`;
  
  // Оновлюємо прогрес, якщо доступний
  if (appState.userProgress) {
    const levelEl = document.getElementById('level');
    const xpBarEl = document.getElementById('xp-bar');
    const coinsEl = document.getElementById('coins');
    const energyEl = document.getElementById('current-energy');
    const energyFillEl = document.getElementById('energy-fill');
    
    if (levelEl) levelEl.textContent = appState.userProgress.level || 0;
    if (xpBarEl) xpBarEl.style.width = `${appState.userProgress.xpPercentage || 0}%`;
    if (coinsEl) coinsEl.textContent = appState.userProgress.coins || 0;
    
    if (energyEl) {
      const currentEnergy = appState.userProgress.energy || 2000;
      const maxEnergy = appState.userProgress.max_energy || 2000;
      energyEl.textContent = `${currentEnergy}/${maxEnergy}`;
      
      if (energyFillEl) {
        energyFillEl.style.width = `${(currentEnergy / maxEnergy) * 100}%`;
      }
    }
  }
}

/**
 * Показати/приховати екран завантаження
 * @param {boolean} show - Показати чи приховати
 */
function showLoading(show) {
  if (loadingScreen) {
    loadingScreen.style.display = show ? 'flex' : 'none';
  }
  
  if (gameUI) {
    gameUI.style.display = show ? 'none' : 'block';
  }
  
  if (errorScreen) {
    errorScreen.style.display = 'none';
  }
}

/**
 * Показати екран помилки
 * @param {string} message - Повідомлення про помилку
 */
function showError(message) {
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  if (gameUI) {
    gameUI.style.display = 'none';
  }
  
  if (errorScreen) {
    errorScreen.style.display = 'flex';
  }
  
  if (errorMessage) {
    errorMessage.textContent = message;
  }
}

/**
 * Показати основний інтерфейс гри
 */
function showGameUI() {
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  if (errorScreen) {
    errorScreen.style.display = 'none';
  }
  
  if (gameUI) {
    gameUI.style.display = 'block';
  }
}

/**
 * Ініціалізація гри з даними користувача
 */
function initGame() {
  // Ініціалізуємо ігрові компоненти
  if (!window.gameAPI) {
    console.warn('gameAPI не знайдено. Можливо, game.js ще не завантажено.');
    return;
  }
  
  // Диспатчимо подію для game.js
  document.dispatchEvent(new CustomEvent('gameInit', {
    detail: {
      user: appState.user,
      progress: appState.userProgress
    }
  }));
  
  console.log('Гра ініціалізована з даними користувача:', {
    user: appState.user,
    progress: appState.userProgress
  });
}

/**
 * Оновлення прогресу користувача
 * @param {Object} newProgress - Новий прогрес
 */
function updateProgress(newProgress) {
  appState.userProgress = newProgress;
  telegramAuth.updateUserProgress(newProgress);
  updateUIWithUserData();
  
  // Оновлюємо на сервері
  telegramAuth.saveUserProgress(newProgress)
    .catch(error => {
      console.error('Помилка збереження прогресу:', error);
    });
}

// Слухачі подій
if (retryButton) {
  retryButton.addEventListener('click', () => {
    initApp();
  });
}

// Обробка кнопки закриття
document.getElementById('close-btn').addEventListener('click', () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.close();
  }
});

// Обробка кнопки меню
document.getElementById('menu-btn').addEventListener('click', () => {
  // Тут можна додати відкриття меню гри
  console.log('Відкрито меню гри');
});

// Слухач на зміну прогресу гри
document.addEventListener('gameProgressUpdate', (event) => {
  if (event.detail && event.detail.progress) {
    updateProgress(event.detail.progress);
  }
});

// Ініціалізація додатка при завантаженні сторінки
document.addEventListener('DOMContentLoaded', initApp);

// Експорт API для доступу з інших модулів
window.appAPI = {
  getUser: () => appState.user,
  getUserProgress: () => appState.userProgress,
  updateUserProgress: updateProgress,
  isAuthenticated: () => telegramAuth.isAuthenticated(),
  getState: () => appState
};

export default {
  getState: () => appState,
  init: initApp,
  updateProgress
};