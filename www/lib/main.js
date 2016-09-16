"use strict";

const api = require("api.io-client");
const co = require("co");
const bindings = require("lib/bindings"); // jshint ignore:line
const extensions = require("lib/extensions"); // jshint ignore:line
const ui = require("lib/ui");
const session = require("lib/session");

module.exports = {
    start: co.wrap(function*(args) {
        yield api.connect(args);
        yield session.loadUser();
        yield ui.start();
    })
};
