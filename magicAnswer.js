require('dotenv').config();
const axios = require('axios');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT = 10000;
const MAX_TOKENS = 10;
const TEMPERATURE = 0.9;
const MAX_RETRIES = 3; // Максимальное количество попыток при дубликате ответа

const BASE_SYSTEM_PROMPT = `Ты - магический шар желаний. Отвечай ТОЛЬКО одним словом или максимум тремя словами на русском. 
Будь краток и загадочно. НИКАКИХ объяснений!`;

/**
 * Проверяет, является ли ответ отрицательным
 * @param {string} answer - Ответ для проверки
 * @returns {boolean} - true если ответ отрицательный
 */
function isNegativeAnswer(answer) {
    if (!answer) return false;
    const normalized = answer.toLowerCase().trim();
    
    // Список отрицательных слов/фраз
    const negativePatterns = [
        'нет',
        'не стоит',
        'маловероятно',
        'нет шансов',
        'не сейчас',
        'не время',
        'осторожнее',
        'не спеши',
        'подожди',
        'однозначно нет',
        'нельзя',
        'не надо',
        'не нужно'
    ];
    
    return negativePatterns.some(pattern => normalized.includes(pattern));
}

/**
 * Генерирует системный промпт в зависимости от количества повторений вопроса и предыдущего ответа
 * @param {number} repeatCount - Количество повторений вопроса
 * @param {string} lastAnswer - Последний ответ на этот вопрос
 * @returns {string} - Системный промпт
 */
function getSystemPromptForRepeat(repeatCount, lastAnswer = null) {
    const wasNegative = lastAnswer && isNegativeAnswer(lastAnswer);
    
    if (repeatCount === 1) {
        // Первый раз - нейтральный ответ (любой вариант)
        return `${BASE_SYSTEM_PROMPT}
Доступные варианты: да, нет, стоит, не стоит, возможно, шанс есть, маловероятно, верь в себя, абсолютно точно, знаки хороши, да судьба, время покажет.`;
    } else if (repeatCount === 2) {
        // Второй раз
        if (wasNegative) {
            // Если первый ответ был отрицательным - сразу негативный
            return `${BASE_SYSTEM_PROMPT}
Доступные варианты: однозначно нет, нет шансов, маловероятно, не стоит, осторожнее, не сейчас, не время, не стоит.`;
        } else {
            // Если был позитивным - энергичный
            return `${BASE_SYSTEM_PROMPT}
Доступные варианты: дерзай, рискни, время действовать, смелее, вперед, не медли.`;
        }
    } else if (repeatCount === 3) {
        // Третий раз
        if (wasNegative) {
            // Если первый был отрицательным - критичный
            return `${BASE_SYSTEM_PROMPT}
Доступные варианты: нет, ты сам не определился, решай сам, хватит спрашивать, подумай сам, не знаю, решай.`;
        } else {
            // Если был позитивным - сомневающийся
            return `${BASE_SYSTEM_PROMPT}
Доступные варианты: может повременить, может подумаешь, время покажет, не спеши, подожди, спроси позже, может не сейчас.`;
        }
    } else if (repeatCount === 4) {
        // Четвертый раз
        if (wasNegative) {
            // Если первый был отрицательным - максимально критичный
            return `${BASE_SYSTEM_PROMPT}
Доступные варианты: нет, ты сам не определился, решай сам, хватит спрашивать, подумай сам, не знаю, решай, перестань спрашивать.`;
        } else {
            // Если был позитивным - негативный
            return `${BASE_SYSTEM_PROMPT}
Доступные варианты: однозначно нет, нет шансов, маловероятно, не стоит, осторожнее, не сейчас, не время.`;
        }
    } else {
        // Пятый раз и более - всегда критичный
        return `${BASE_SYSTEM_PROMPT}
Доступные варианты: нет, ты сам не определился, решай сам, хватит спрашивать, подумай сам, не знаю, решай, перестань спрашивать.`;
    }
}

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
 * @param {number} [repeatCount=1] - Количество повторений вопроса
 * @returns {Promise<string>} - Ответ магического шара
 */
async function getMagicAnswer(question, apiKey = null, history = [], lastAnswer = null, lastQuestion = null, repeatCount = 1) {
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

    // Генерируем системный промпт в зависимости от количества повторений и предыдущего ответа
    // Для того же вопроса используем lastAnswer, для нового - null
    const systemPrompt = getSystemPromptForRepeat(repeatCount, sameQuestion ? lastAnswer : null);

    // Формируем массив сообщений для API
    const messages = [
        {
            role: 'system',
            content: systemPrompt
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

