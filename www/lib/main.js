"use strict";

const Bluebird = require("bluebird");
const co = Bluebird.coroutine;

const api = require("api.io-client");
const ui = require("./ui");

module.exports = {
    start: co(function*(args) {
        yield api.connect(args);
        yield ui.start();

        // TODO: temp
        yield api.auth.session();
        let result = yield api.vfs.list("/");
        console.log("result", result);
    })
};
