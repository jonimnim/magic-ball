FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
# Используем npm ci если есть package-lock.json, иначе npm install
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# Копируем остальные файлы приложения
COPY . .

# Устанавливаем переменные окружения (если нужны дефолтные значения)
# ENV NODE_ENV=production

# Экспортируем порт (если понадобится для webhook)
# EXPOSE 3000

# По умолчанию запускаем консольную версию
CMD ["node", "index.js"]

