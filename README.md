# About

MURRiX is a specialized Content Management System. The intention is to have a tool where lives can be documented. MURRiX enables storing and organizing of photos, written texts, events etc.
All items in the database can be connected to people, things and should be positioned geographically as well as in time.

The aim is to visualize all this information in a way that is easy to understand and use. Photos and other content should always be accessible and not just stored away in a box somewhere where they are never looked at. By recording content from lives in a family a repository with the family history will be created where everyone in the family can view and add to the content.

Data is stored and represented by nodes and items. Nodes are things like locations, persons, cars, albums, cameras etc. A node can have several items connected to it in different ways. A person can be set as the creator of a photo, a camera as the device with which a photo was taken and so forth. An item should, if applicable, always have a position in both space and time. Keywords that represent an item are “who”, “with”, “when” and “where”. Examples of items are photos, logbook entries, events such as birth, death etc.

The main use case is for a family to share their common history and lives, a repository for pictures and a family tree. But MURRiX could also be used only as an online photo album if so desired.

MURRiX tries to leverage the latest technologies available and relies heavily on HTML5 which makes a newer browser a requirement. Javascript is used throughout the application, MongoDB as database, Node.js as backend and in the browser.


## Dependencies Ubuntu

    $ sudo apt-add-repository http://ppa.launchpad.net/chris-lea/node.js/ubuntu
    $ sudo apt-add-repository http://ppa.launchpad.net/jon-severinsson/ffmpeg/ubuntu
    $ sudo aptitude update
    $ sudo apt-get install nodejs npm git mongodb libsox-dev libpng-dev libimage-exiftool-perl imagemagick mpg123 ffmpeg ufraw-batch

## How to install

    $ git clone https://github.com/mattiasrunge/MURRiX.git
    $ cd MURRiX
    $ npm install

## How to configure

In general no configuration options are needed but if something needs to be changed, the wanted options can be overridden by defining a config.json file and adding the paramters that needs to be changed. config.sample.json contains all available options, but a config.json should only contain the changed parameters.

    $ cp config.sample.json config.json
    $ emacs config.json

## How to use

    $ node murrix

Now you can start your brower and access MURRiX at port 8080 if the configuration was not changed. The default admin username and password are: admin/password

## Credits

* [Node.js](http://nodejs.org/)
* [MongoDB](http://www.mongodb.org/)
* [Socket.IO](http://socket.io/)
* [node-static](https://github.com/cloudhead/node-static)
* [sha1](https://github.com/pvorb/node-sha1)
* [JSHint](http://www.jshint.com/)
* [Exiftool](http://owl.phy.queensu.ca/~phil/exiftool/)
* [FFmpeg](http://ffmpeg.org/)
* [Google Maps](https://maps.google.se/)
