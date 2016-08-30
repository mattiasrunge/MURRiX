"use strict";

const api = require("api.io-client");
const utils = require("lib/utils");
const bindings = require("lib/bindings"); // jshint ignore:line
const ui = require("lib/ui");
const session = require("lib/session");

module.exports = {
    start: utils.co(function*(args) {
        yield api.connect(args);
        yield session.loadUser();
        yield ui.start();
    })
};
