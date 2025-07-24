FROM node:lts-buster
RUN git clone https://github.com/SilvaTechB/silva-md-bot/root/silva
WORKDIR /root/silva
RUN npm install && npm install -g pm2 || yarn install --network-concurrency 1
COPY . .
EXPOSE 9090
CMD ["npm", "start"]
