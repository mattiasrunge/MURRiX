"use strict";

const path = require("path");
const fs = require("fs-extra");
const log = require("./log")(module);

module.exports = {
    init: async (args) => {
        log.info(`Loading configuration from ${JSON.stringify(args.config)}...`);

        const defaults = JSON.parse(await fs.readFile(path.join(__dirname, "..", "..", "conf", "defaults.json")));
        const config = JSON.parse(await fs.readFile(path.join(__dirname, args.config)));

        Object.assign(module.exports, defaults, config, args);
    }
};
