FROM node:12-stretch-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json ./
RUN yarn

# Copy app source
COPY . .

EXPOSE 8080
CMD [ "node", "index.js" ]
