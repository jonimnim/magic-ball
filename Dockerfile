FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем остальные файлы приложения
COPY . .

# Устанавливаем переменные окружения (если нужны дефолтные значения)
# ENV NODE_ENV=production

# Экспортируем порт (если понадобится для webhook)
# EXPOSE 3000

# По умолчанию запускаем консольную версию
CMD ["node", "index.js"]

