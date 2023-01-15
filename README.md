# About

MURRiX is a specialized Content Management System. The intention is to have a tool where lives can be documented. MURRiX enables storing and organizing of photos, written texts, events etc.
All items in the database can be connected to people, things and should be positioned geographically as well as in time.

The aim is to visualize all this information in a way that is easy to understand and use. Photos and other content should always be accessible and not just stored away in a box somewhere where they are never looked at. By recording content from lives in a family a repository with the family history will be created where everyone in the family can view and add to the content.

Data is stored and represented by nodes in a virtual filesystem which are stored in a database. Nodes are things like locations, persons, albums, cameras etc. Things should, if applicable, always have a position in both space and time. Properties that represent an item are “who”, “with”, “when” and “where”. Examples of items are photos, logbook entries, events such as birth, death etc.

The main use case is for a family to share their common history and lives, a repository for pictures and a family tree. But MURRiX could also be used only as an online photo album if so desired.

MURRiX tries to leverage the latest technologies available and relies heavily on HTML5 which makes a newer browser a requirement. Javascript is used throughout the application, MongoDB as database, Node.js as backend and in the browser.

## Install node.js
```bash
do apt-get install -y build-essential
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Start
TODO: Describe MCS docker
TODO: Describe MURRiX core docker
TODO: Describe MURRiX ui docker

## Development
```bash
git clone https://github.com/mattiasrunge/MURRiX
cd MURRiX
yarn
```


# Redis

docker run -d --name murrix-redis -p 6379:6379 redis:latest

# RabbitMQ

docker run -d --name murrix-rabbitmq -p 15672:15672 -p 5672:5672 rabbitmq:3-management

http://localhost:15672/

# MongoDB

docker run -d --name murrix-mongodb -p 27017:27017 mongo:latest