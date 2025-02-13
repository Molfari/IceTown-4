// bot.js
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

// Константи
const BOT_TOKEN = '7618848302:AAGn-pGhIgyk82VpXUyTw5aiIzQkXArYq5c';
const WEB_APP_URL = 'https://molfari.github.io/IceTown-4/';

// Створюємо екземпляр бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Обробка команди /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Звичайна клавіатура
    const keyboard = {
        reply_markup: {
            keyboard: [[{
                text: '🎮 Play Ice Town',
                web_app: { url: WEB_APP_URL }
            }]],
            resize_keyboard: true
        }
    };

    // Inline клавіатура
    const inlineKeyboard = {
        reply_markup: {
            inline_keyboard: [[
                { text: '🎮 Play Ice Town', web_app: { url: WEB_APP_URL } }
            ]]
        }
    };

    // Відправляємо привітальне повідомлення зі звичайною клавіатурою
    await bot.sendMessage(chatId, 
        'Welcome to Ice Town! 🎮❄️\n\n' +
        'Capture frozen buildings, earn gold, and compete with other players!\n\n' +
        'Click the button below to start playing:', 
        keyboard
    );

    // Відправляємо inline кнопку як альтернативу
    await bot.sendMessage(chatId, 'Or use this button:', inlineKeyboard);
});

// Обробка команди /help
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpText = 
        '❄️ *Ice Town Help* ❄️\n\n' +
        '*Game Rules:*\n' +
        '1. Tap frozen buildings to capture them\n' +
        '2. Each tap costs 1 Energy\n' +
        '3. Captured buildings earn you Gold\n' +
        '4. Collect XP to level up\n\n' +
        '*Commands:*\n' +
        '/start - Start the game\n' +
        '/help - Show this help message\n' +
        '/webapp - Launch the game\n\n' +
        '*Need more help?*\n' +
        'Contact @support_username';

    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

// Обробка команди /webapp
bot.onText(/\/webapp/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId, 'Launch Ice Town:', {
        reply_markup: {
            inline_keyboard: [[
                { text: '🎮 Play Now', web_app: { url: WEB_APP_URL } }
            ]]
        }
    });
});

// Обробка даних від WebApp
bot.on('web_app_data', async (msg) => {
    const chatId = msg.chat.id;
    const data = msg.web_app_data.data;
    
    try {
        // Тут можна додати обробку даних від WebApp
        console.log('Received WebApp data:', data);
        await bot.sendMessage(chatId, 'Data received from WebApp');
    } catch (error) {
        console.error('Error processing WebApp data:', error);
        await bot.sendMessage(chatId, 'Error processing data from WebApp');
    }
});

// Функція для валідації даних від WebApp
function validateWebAppData(initData) {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        // Сортуємо параметри
        const params = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Створюємо HMAC
        const secret = crypto.createHmac('sha256', 'WebAppData')
            .update(BOT_TOKEN)
            .digest();

        const calculatedHash = crypto.createHmac('sha256', secret)
            .update(params)
            .digest('hex');

        return calculatedHash === hash;
    } catch (error) {
        console.error('WebApp validation error:', error);
        return false;
    }
}

// Обробка помилок
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// Експортуємо функції для використання в веб-додатку
module.exports = {
    validateWebAppData
};