"use strict";

const api = require("api.io-client");
const bindings = require("lib/bindings"); // jshint ignore:line
const extensions = require("lib/extensions"); // jshint ignore:line
const ui = require("lib/ui");
const session = require("lib/session");

module.exports = {
    start: async (args) => {
        await api.connect(args);
        await session.loadUser();
        await ui.start();
    }
};
