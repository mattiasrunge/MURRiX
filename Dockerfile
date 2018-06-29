FROM node:10-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install --only=production

CMD [ "npm", "start" ]
