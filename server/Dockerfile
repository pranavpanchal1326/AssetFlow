FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY assetflow.db ./assetflow.db

# Create directory for persistent sqlite db volume
RUN mkdir -p /data

ENV PORT=8080
ENV NODE_ENV=production
ENV DB_PATH=/data/assetflow.db

EXPOSE 8080
CMD ["npm", "start"]
