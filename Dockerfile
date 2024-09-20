FROM quay.io/gurusensei/gurubhay:latest

RUN git clone https://github.com/SilvaTechB/silva-md-bot /root/silva

WORKDIR /root/silva/

RUN npm install --platform=linuxmusl

EXPOSE 5000

CMD ["npm", "start"]
