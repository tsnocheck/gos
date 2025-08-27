# 1. Используем официальный образ Node.js (LTS)
FROM node:20-alpine

# 2. Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# 3. Копируем package.json и package-lock.json
COPY package*.json ./

# 4. Устанавливаем зависимости (только production, чтобы уменьшить размер образа)
RUN npm install

# 5. Копируем весь код проекта
COPY . .

# 6. Компилируем TypeScript (если используется NestJS с TypeScript)
RUN npm run build

# 7. Открываем порт, на котором работает приложение
EXPOSE 3000

# 8. Запускаем приложение
CMD ["npm", "run", "start"]
