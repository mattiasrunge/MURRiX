"use strict";

const co = require("bluebird").coroutine;
const path = require("path");
const glob = require("glob-promise");
const vorpal = require("./vorpal");

require("colors"); // Modifies the string prototype

module.exports = {
    start: co(function*() {
        let files = yield glob(path.join(__dirname, "commands", "**/*.js"));
        files.forEach(require);

        vorpal
        .history("murrix-cli")
        .show();
    })
};
