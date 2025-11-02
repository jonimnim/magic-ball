require('dotenv').config();
const axios = require('axios');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT = 10000;
const MAX_TOKENS = 10;
const TEMPERATURE = 0.9;
const MAX_RETRIES = 3; // Максимальное количество попыток при дубликате ответа

const SYSTEM_PROMPT = `Ты - магический шар желаний. Отвечай ТОЛЬКО одним словом или максимум тремя словами на русском. 
Доступные варианты: да, нет, возможно, шанс есть, маловероятно, время покажет, дерзай, подожди, спроси позже, 
абсолютно точно, нет шансов, верь в себя, знаки хороши, не сейчас, рискни, осторожнее, да судьба, не время.
Будь краток и загадочно. НИКАКИХ объяснений!`;

/**
 * Проверяет, является ли ответ дубликатом последнего ответа
 * @param {string} newAnswer - Новый ответ
 * @param {string} lastAnswer - Последний ответ
 * @returns {boolean} - true если ответы идентичны
 */
function isDuplicateAnswer(newAnswer, lastAnswer) {
    if (!lastAnswer) return false;
    // Нормализуем ответы для сравнения (приводим к нижнему регистру, убираем лишние пробелы)
    const normalizedNew = newAnswer.toLowerCase().trim();
    const normalizedLast = lastAnswer.toLowerCase().trim();
    return normalizedNew === normalizedLast;
}

/**
 * Выполняет запрос к API DeepSeek
 * @param {Array} messages - Массив сообщений для контекста
 * @param {string} apiKey - API ключ
 * @param {number} temperature - Температура для генерации
 * @returns {Promise<string>} - Ответ от API
 */
async function makeApiRequest(messages, apiKey, temperature = TEMPERATURE) {
    const response = await axios.post(DEEPSEEK_API_URL, {
        model: DEEPSEEK_MODEL,
        messages: messages,
        max_tokens: MAX_TOKENS,
        temperature: temperature
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        timeout: REQUEST_TIMEOUT
    });

    const answer = response.data?.choices?.[0]?.message?.content?.trim();
    
    if (!answer) {
        throw new Error('Пустой ответ от API');
    }

    return answer;
}

/**
 * Проверяет, является ли вопрос идентичным последнему вопросу
 * @param {string} question - Текущий вопрос
 * @param {string} lastQuestion - Последний вопрос
 * @returns {boolean} - true если вопросы идентичны
 */
function isSameQuestion(question, lastQuestion) {
    if (!lastQuestion) return false;
    // Нормализуем вопросы для сравнения
    const normalizedQuestion = question.toLowerCase().trim();
    const normalizedLast = lastQuestion.toLowerCase().trim();
    return normalizedQuestion === normalizedLast;
}

/**
 * Получает ответ от магического шара на заданный вопрос
 * @param {string} question - Вопрос пользователя
 * @param {string} [apiKey] - API ключ DeepSeek (если не передан, берется из env)
 * @param {Array} [history] - История диалога в формате [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
 * @param {string} [lastAnswer] - Последний ответ для проверки дубликатов
 * @param {string} [lastQuestion] - Последний вопрос для проверки дубликатов
 * @returns {Promise<string>} - Ответ магического шара
 */
async function getMagicAnswer(question, apiKey = null, history = [], lastAnswer = null, lastQuestion = null) {
    const key = apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!key) {
        throw new Error('DEEPSEEK_API_KEY не найден в переменных окружения');
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        throw new Error('Вопрос должен быть непустой строкой');
    }

    const trimmedQuestion = question.trim();
    
    // Проверяем, является ли это тем же вопросом
    const sameQuestion = isSameQuestion(trimmedQuestion, lastQuestion);

    // Формируем массив сообщений для API
    const messages = [
        {
            role: 'system',
            content: SYSTEM_PROMPT
        },
        // Добавляем историю диалога (ограничиваем последние 10 сообщений для экономии токенов)
        ...history.slice(-10),
        {
            role: 'user',
            content: trimmedQuestion
        }
    ];

    try {
        let answer;
        let attempts = 0;
        let currentTemperature = TEMPERATURE;

        // Пытаемся получить ответ, избегая дубликатов только для того же вопроса
        do {
            answer = await makeApiRequest(messages, key, currentTemperature);
            attempts++;

            // Проверяем дубликат только если вопрос идентичен последнему
            if (sameQuestion && isDuplicateAnswer(answer, lastAnswer) && attempts < MAX_RETRIES) {
                // Увеличиваем температуру для разнообразия ответа на тот же вопрос
                currentTemperature = Math.min(1.5, TEMPERATURE + (attempts * 0.2));
            } else {
                break;
            }
        } while (attempts < MAX_RETRIES);

        return answer;
    } catch (error) {
        if (error.response) {
            console.error('❌ Ошибка DeepSeek API:', {
                status: error.response.status,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('❌ Нет ответа от сервера:', error.message);
        } else {
            console.error('❌ Ошибка запроса:', error.message);
        }
        
        throw error;
    }
}

module.exports = { getMagicAnswer };

