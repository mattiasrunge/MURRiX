"use strict";

const Bluebird = require("bluebird");
const co = Bluebird.coroutine;

const api = require("api.io").client;
const session = require("./session");
const shell = require("./shell");

module.exports = {
    start: co(function*(args) {
        yield api.connect(args);
        yield session.init();

        yield shell.start();
    }),
    stop: co(function*() {
        console.log("Received shutdown signal, stoppping...");
        yield api.disconnect();
    })
};
