# Don't change this [ /SilvaTech/ ] name!
# Change from below link, else bot wil not work!


FROM quay.io/sampandey001/secktor

RUN git clone https://github.com/SilvaTechB/SilvaGifted /root/SilvaTech

# Clear npm cache and remove node_modules directories
RUN npm cache clean --force
RUN rm -rf /root/SilvaTech/node_modules

# Install dependencies
WORKDIR /root/SilvaTech
RUN npm install

# Add additional Steps To Run...
EXPOSE 3000
CMD ["npm","start" ]