"use strict";

const co = require("bluebird").coroutine;
const path = require("path");
const glob = require("glob-promise");
const vorpal = require("./vorpal");

require("colors"); // Modifies the string prototype

module.exports = {
    start: co(function*() {
        let commands = yield glob(path.join(__dirname, "commands", "**/*.js"));
        commands.forEach(module.exports.loadCommand);

        yield module.exports.loadPlugins();

        vorpal
        .history("murrix-cli")
        .show();
    }),
    loadPlugins: co(function*() {
        let pattern = path.join(__dirname, "..", "..", "plugins", "**", "commands", "*.js");
        let filenames = yield glob(pattern);
        filenames.forEach(module.exports.loadCommand);
    }),
    loadCommand: (filename) => {
        try {
            require(filename);
        } catch (e) {
            console.error("Failed to load " + filename);
            throw e;
        }
    }
};
