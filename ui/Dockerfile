FROM node:14-stretch-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json ./
RUN yarn

# Copy app source
COPY . .

ENV DISABLE_ESLINT_PLUGIN=true

# Build UI
RUN yarn build

EXPOSE 8787
CMD [ "yarn", "serve" ]
