"use strict";

const co = require("bluebird").coroutine;
const client = require("./client");
const session = require("./session");
const shell = require("./shell");

module.exports = {
    start: co(function*(args) {
        yield client.init(args);
        yield session.init();

        yield shell.start();
    }),
    stop: co(function*() {
        console.log("Received shutdown signal, stoppping...");
        yield client.stop();
    })
};
