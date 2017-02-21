"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const log = require("./log")(module);

module.exports = {
    init: async (args) => {
        log.info("Loading configuration from " + args.config + "...");

        let defaults = JSON.parse(await fs.readFileAsync(path.join(__dirname, "..", "..", "conf", "defaults.json")));
        let config = JSON.parse(await fs.readFileAsync(path.join(__dirname, args.config)));
        Object.assign(module.exports, defaults, config, args);
    }
};
