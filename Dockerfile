FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD ["node", "dist/main"]
