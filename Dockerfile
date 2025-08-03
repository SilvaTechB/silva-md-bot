FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the port
EXPOSE 9090

# Start the bot
CMD ["node", "silva.js"]
