FROM node:10-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache --virtual=build-dependencies git

COPY . .

RUN npm install --only=production

CMD [ "npm", "start" ]
