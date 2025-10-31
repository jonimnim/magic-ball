require('dotenv').config();
const axios = require('axios');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT = 10000;
const MAX_TOKENS = 10;
const TEMPERATURE = 0.9;

const SYSTEM_PROMPT = `Ты - магический шар желаний. Отвечай ТОЛЬКО одним словом или максимум тремя словами на русском. 
Доступные варианты: да, нет, возможно, шанс есть, маловероятно, время покажет, дерзай, подожди, спроси позже, 
абсолютно точно, нет шансов, верь в себя, знаки хороши, не сейчас, рискни, осторожнее, да судьба, не время.
Будь краток и загадочно. НИКАКИХ объяснений!`;

/**
 * Получает ответ от магического шара на заданный вопрос
 * @param {string} question - Вопрос пользователя
 * @param {string} [apiKey] - API ключ DeepSeek (если не передан, берется из env)
 * @returns {Promise<string>} - Ответ магического шара
 */
async function getMagicAnswer(question, apiKey = null) {
    const key = apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!key) {
        throw new Error('DEEPSEEK_API_KEY не найден в переменных окружения');
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        throw new Error('Вопрос должен быть непустой строкой');
    }

    try {
        const response = await axios.post(DEEPSEEK_API_URL, {
            model: DEEPSEEK_MODEL,
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: question.trim()
                }
            ],
            max_tokens: MAX_TOKENS,
            temperature: TEMPERATURE
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            timeout: REQUEST_TIMEOUT
        });

        const answer = response.data?.choices?.[0]?.message?.content?.trim();
        
        if (!answer) {
            throw new Error('Пустой ответ от API');
        }

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

