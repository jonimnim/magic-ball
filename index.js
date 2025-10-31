require('dotenv').config();
const { getMagicAnswer } = require('./magicAnswer');

const API_KEY = process.env.DEEPSEEK_API_KEY;

// Проверка наличия API ключа
if (!API_KEY) {
    console.error('❌ Ошибка: API ключ не найден!');
    console.log('📝 Создайте файл .env в той же папке с содержимым:');
    console.log('DEEPSEEK_API_KEY=your_actual_api_key_here');
    process.exit(1);
}

// Получаем вопрос из аргументов или используем стандартный
const userQuestion = process.argv[2] || "Стоит ли мне начинать этот проект?";

console.log(`🔮 Магический шар, ответь мне...`);
console.log(`❓ Вопрос: ${userQuestion}`);
console.log(`⏳ Запрашиваю ответ...\n`);

getMagicAnswer(userQuestion)
    .then(answer => {
        console.log(`✨ Ответ: ${answer}`);
    })
    .catch(error => {
        console.error('💥 Непредвиденная ошибка:', error.message);
        console.log('✨ Ответ: Ошибка магии');
    });
