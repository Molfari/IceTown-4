// game.js
// Оновлено для інтеграції з Telegram авторизацією

// Game state
let xp = 0;
let level = 0;
let energy = 2000;
let coins = 0;
let buildings_captured = 0;
const MAX_ENERGY = 2000;

// Дані користувача
let userData = null;

// DOM Elements
const xpBar = document.getElementById("xp-bar");
const levelText = document.getElementById("level");
const currentEnergyText = document.getElementById("current-energy");
const energyFill = document.getElementById("energy-fill");
const coinsElement = document.getElementById("coins");

// Функція для оновлення XP та енергії
function increaseXP() {
  console.log('increaseXP called', { energy, xp, level }); // Debug log

  if (energy > 0) {
    // Зменшуємо енергію
    energy -= 1;
    currentEnergyText.textContent = `${energy}/${MAX_ENERGY}`;
    energyFill.style.width = `${(energy / MAX_ENERGY) * 100}%`;
    
    // Оновлюємо XP і Level
    xp += 1;
    if (xp >= 100) {
      level += 1;
      levelText.textContent = level;
      xp = 0;
      
      // Відправляємо дані про новий рівень в Telegram
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
    xpBar.style.width = `${xp}%`;

    // Відправляємо подію про оновлення прогресу
    updateGameProgress();

    console.log('After update:', { energy, xp, level }); // Debug log
    return true;
  }

  console.log('Not enough energy'); // Debug log
  
  // Показуємо повідомлення про нестачу енергії
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    window.Telegram.WebApp.showAlert('Not enough energy! Wait for recharge or buy energy boost.');
  }
  return false;
}

// Функція для оновлення монет
function updateCoins(amount) {
  console.log('updateCoins called:', amount); // Debug log
  coins += amount;
  coinsElement.textContent = coins;
  
  // Відправляємо подію про оновлення прогресу
  updateGameProgress();
}

// Функція для збільшення кількості захоплених будівель
function increaseCapturedBuildings() {
  buildings_captured += 1;
  
  // Відправляємо подію про оновлення прогресу
  updateGameProgress();
  
  return buildings_captured;
}

// Функція для оновлення прогресу гри і синхронізації з сервером
function updateGameProgress() {
  // Збираємо дані прогресу
  const progressData = {
    level,
    xp,
    coins,
    energy,
    buildings_captured
  };
  
  // Диспатчимо подію для оновлення прогресу в app.js
  document.dispatchEvent(new CustomEvent('gameProgressUpdate', {
    detail: {
      progress: progressData
    }
  }));
  
  return progressData;
}

// Ініціалізація гри
document.addEventListener('DOMContentLoaded', function() {
  console.log('Game initialized'); // Debug log
});

// Обробка події ініціалізації гри з даними користувача
document.addEventListener('gameInit', function(event) {
  console.log('Game init event received', event.detail);
  
  userData = event.detail.user;
  const progress = event.detail.progress;
  
  // Оновлюємо стан гри з отриманого прогресу
  if (progress) {
    xp = progress.xp || 0;
    level = progress.level || 0;
    coins = progress.coins || 0;
    energy = progress.energy || MAX_ENERGY;
    buildings_captured = progress.buildings_captured || 0;
    
    // Оновлюємо UI
    levelText.textContent = level;
    xpBar.style.width = `${(xp / 100) * 100}%`;
    coinsElement.textContent = coins;
    currentEnergyText.textContent = `${energy}/${MAX_ENERGY}`;
    energyFill.style.width = `${(energy / MAX_ENERGY) * 100}%`;
  }
  
  console.log('Game initialized with user data:', {
    userData,
    progress: { xp, level, coins, energy, buildings_captured }
  });
});

// Функція для перевірки доступності сервісів Telegram
function isTelegramAvailable() {
  return window.Telegram && window.Telegram.WebApp;
}

// Експортуємо API
window.gameAPI = {
  increaseXP,
  updateCoins,
  increaseCapturedBuildings,
  getEnergy: () => energy,
  getLevel: () => level,
  getXP: () => xp,
  getCoins: () => coins,
  getCapturedBuildings: () => buildings_captured,
  isTelegramAvailable,
  updateGameProgress
};

// Debug функція для перевірки стану гри
window.debugGameState = function() {
  console.log('Current game state:', {
    xp,
    level,
    energy,
    coins,
    buildings_captured,
    telegramAvailable: isTelegramAvailable(),
    apiAvailable: !!window.gameAPI,
    domElements: {
      xpBar: !!xpBar,
      levelText: !!levelText,
      currentEnergyText: !!currentEnergyText,
      energyFill: !!energyFill,
      coinsElement: !!coinsElement
    }
  });
};