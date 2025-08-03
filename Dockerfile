FROM node:20-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy bot files
COPY . .

# Expose port for express server
EXPOSE 9090

# Start the bot
CMD ["node", "silva.js"]
