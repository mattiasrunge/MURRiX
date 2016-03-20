"use strict";

const Bluebird = require("bluebird");
const co = Bluebird.coroutine;

const api = require("api.io-client");
const ui = require("./ui");

module.exports = {
    start: co(function*(args) {
        yield api.connect(args);
        console.log(yield api.auth.session());
        yield ui.start();
    })
};
