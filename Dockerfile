FROM node:20-slim

LABEL org.opencontainers.image.source="https://github.com/SilvaTechB/silva-md-v4"
LABEL org.opencontainers.image.description="Silva MD — Multi-device WhatsApp Bot with 1200+ commands"
LABEL org.opencontainers.image.licenses="Apache-2.0"

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    webp \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production --ignore-scripts

COPY . .

RUN mkdir -p session data

EXPOSE 25680

CMD ["node", "silva.js"]
