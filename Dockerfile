# Dockerfile — no build secrets; env vars injected at runtime by Railway
FROM node:18-alpine
WORKDIR /app
COPY whisper-backend/package*.json ./
RUN npm ci --only=production
COPY whisper-backend/ .
EXPOSE 3000
CMD ["node", "server.js"]
