require('dotenv').config();
const { Telegraf } = require('telegraf');
const { getMagicAnswer } = require('./magicAnswer');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Проверка токенов
if (!TELEGRAM_TOKEN || !DEEPSEEK_API_KEY) {
    console.error('❌ Ошибка: Не найдены TELEGRAM_BOT_TOKEN или DEEPSEEK_API_KEY в .env файле');
    process.exit(1);
}

const bot = new Telegraf(TELEGRAM_TOKEN);

// Хранилище контекста для каждого пользователя
// Структура: Map<userId, {history: Array, lastAnswer: string, lastQuestion: string, questionCounts: Map}>
const userContexts = new Map();
const MAX_HISTORY_LENGTH = 20; // Максимальная длина истории диалога

// Обработчики бота
bot.start((ctx) => {
    ctx.reply(`🔮 *Привет! Я Магический Шар Судьбы* 

Задай мне любой вопрос, и я отвечу кратко и загадочно!

*Примеры вопросов:*
• Стоит ли мне начать проект?
• Получу ли я повышение?
• Стоит ли доверять этому человеку?
• Ждать ли мне изменений в жизни?

*Просто напиши свой вопрос...*`, { parse_mode: 'Markdown' });
});

bot.help((ctx) => {
    ctx.reply(`💫 *Как пользоваться магическим шаром:*

1. Задай вопрос о будущем, решениях или возможностях
2. Я отвечу одним-тремя словами
3. Интерпретируй ответ интуитивно!

*Примеры ответов:* 
✅ да, возможно, дерзай, время покажет, верь в себя
❌ нет, маловероятно, не сейчас, осторожнее

*Задавай вопросы с верой в магию!* 🔮`, { parse_mode: 'Markdown' });
});

// Обработка всех текстовых сообщений
bot.on('text', async (ctx) => {
    const question = ctx.message.text;
    const userId = ctx.from.id;
    
    // Игнорируем команды
    if (question.startsWith('/')) return;
    
    try {
        // Отправляем статус "печатает"
        await ctx.sendChatAction('typing');
        
        // Получаем или создаем контекст пользователя
        if (!userContexts.has(userId)) {
            userContexts.set(userId, {
                history: [],
                lastAnswer: null,
                lastQuestion: null,
                questionCounts: new Map() // Счетчик повторений для каждого вопроса
            });
        }
        
        const userContext = userContexts.get(userId);
        const normalizedQuestion = question.trim().toLowerCase();
        
        // Подсчитываем количество повторений текущего вопроса
        const questionCount = userContext.questionCounts.get(normalizedQuestion) || 0;
        const newQuestionCount = questionCount + 1;
        userContext.questionCounts.set(normalizedQuestion, newQuestionCount);
        
        // Получаем ответ от магического шара с учетом контекста и количества повторений
        const answer = await getMagicAnswer(
            question, 
            null, 
            userContext.history, 
            userContext.lastAnswer,
            userContext.lastQuestion,
            newQuestionCount
        );
        
        // Обновляем контекст пользователя
        // Добавляем вопрос в историю
        userContext.history.push({
            role: 'user',
            content: question.trim()
        });
        
        // Добавляем ответ в историю
        userContext.history.push({
            role: 'assistant',
            content: answer
        });
        
        // Ограничиваем длину истории
        if (userContext.history.length > MAX_HISTORY_LENGTH) {
            userContext.history = userContext.history.slice(-MAX_HISTORY_LENGTH);
        }
        
        // Сохраняем последний вопрос и ответ
        userContext.lastQuestion = question.trim();
        userContext.lastAnswer = answer;
        
        // Форматируем ответ
        const formattedAnswer = `🔮 *Твой вопрос:* ${question}\n\n✨ *Ответ судьбы:* ${answer}`;
        
        await ctx.reply(formattedAnswer, { parse_mode: 'Markdown' });
        
    } catch (error) {
        console.error('Ошибка бота:', error);
        await ctx.reply('⚠️ Магия временно недоступна... Попробуй позже');
    }
});

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error('Ошибка Telegraf:', err);
    ctx.reply('❌ Произошла магическая ошибка...');
});

// Запуск бота
console.log('🚀 Запускаю магического телеграм бота...');
bot.launch().then(() => {
    console.log('✅ Бот успешно запущен!');
});

// Корректное завершение работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));