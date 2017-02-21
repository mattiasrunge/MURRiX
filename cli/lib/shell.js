"use strict";

const path = require("path");
const glob = require("glob-promise");
const vorpal = require("./vorpal");

require("colors"); // Modifies the string prototype

module.exports = {
    start: async () => {
        let commands = await glob(path.join(__dirname, "commands", "**/*.js"));
        commands.forEach(module.exports.loadCommand);

        await module.exports.loadPlugins();

        vorpal
        .history("murrix-cli")
        .show();
    },
    loadPlugins: async () => {
        let pattern = path.join(__dirname, "..", "..", "plugins", "**", "commands", "*.js");
        let filenames = await glob(pattern);
        filenames.forEach(module.exports.loadCommand);
    },
    loadCommand: (filename) => {
        try {
            require(filename);
        } catch (e) {
            console.error("Failed to load " + filename);
            throw e;
        }
    }
};
