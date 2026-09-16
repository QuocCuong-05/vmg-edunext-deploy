FROM node:22-alpine

WORKDIR /app

COPY backend/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY backend/ ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
