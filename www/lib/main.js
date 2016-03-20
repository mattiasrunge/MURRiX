"use strict";

const api = require("api.io-client");
const ui = require("lib/ui");
const utils = require("lib/utils");

module.exports = {
    start: utils.co(function*(args) {
        yield api.connect(args);
        console.log(yield api.auth.session());
        yield ui.start();
    })
};
