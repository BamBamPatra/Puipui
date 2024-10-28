FROM node:lts AS develop

WORKDIR /app

COPY package*.json /app/
COPY package-lock.json /app/

COPY . /app/
RUN npm ci 

EXPOSE 3000

CMD [ "node", "server.js" ]