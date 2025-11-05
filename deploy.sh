#!/bin/bash

set -e

echo "🚀 Начинаем развертывание Magic Ball..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo "Создайте файл .env с переменными:"
    echo "  DEEPSEEK_API_KEY=your_key"
    echo "  TELEGRAM_BOT_TOKEN=your_token"
    exit 1
fi

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен!${NC}"
    exit 1
fi

# Проверка наличия Docker Compose
if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлен!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Проверки пройдены${NC}"

# Остановка текущих контейнеров
echo "🛑 Останавливаю текущие контейнеры..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

# Получение обновлений (если это git репозиторий)
if [ -d .git ]; then
    echo "📥 Получаю обновления из Git..."
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "Не удалось получить обновления (это нормально, если нет удаленного репозитория)"
fi

# Пересборка образов
echo "🔨 Собираю Docker образы..."
if docker compose version &> /dev/null; then
    docker compose build
    docker compose up -d
else
    docker-compose build
    docker-compose up -d
fi

# Ожидание запуска
echo "⏳ Ожидаю запуск контейнеров..."
sleep 3

# Проверка статуса
echo "📊 Статус контейнеров:"
if docker compose version &> /dev/null; then
    docker compose ps
else
    docker-compose ps
fi

echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo ""
echo "Для просмотра логов используйте:"
echo "  docker-compose logs -f telegram-bot"
echo ""
echo "Для остановки используйте:"
echo "  docker-compose down"

