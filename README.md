# 🔮 Magic Ball - Магический Шар Судьбы

Telegram-бот и консольное приложение для получения кратких ответов от магического шара на любые вопросы.

## 🚀 Запуск через Docker

### Предварительные требования

1. Создайте файл `.env` в корне проекта:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Запуск консольной версии

```bash
docker-compose up magic-ball
```

Или с помощью Dockerfile:
```bash
docker build -t magic-ball .
docker run --env-file .env magic-ball "Ваш вопрос?"
```

### Запуск Telegram бота

```bash
docker-compose up telegram-bot
```

### Запуск всего стека

```bash
docker-compose up
```

### Фоновый режим

```bash
docker-compose up -d
```

### Остановка

```bash
docker-compose down
```

## 📦 Установка без Docker

```bash
npm install
```

### Консольная версия

```bash
npm start
# или
node index.js "Ваш вопрос?"
```

### Telegram бот

```bash
npm run start-bot
# или
node telegram_bot.js
```

## 📝 Использование

### Консольная версия

```bash
node index.js "Стоит ли мне начать этот проект?"
```

### Telegram бот

Просто отправьте боту любой вопрос в Telegram.

## 🛠 Технологии

- Node.js
- Telegraf (Telegram Bot API)
- DeepSeek API
- Docker

## 📄 Лицензия

ISC

