"use strict";

const co = require("bluebird").coroutine;
const extend = require("extend");
const fs = require("fs-extra-promise");
const log = require("./log")(module);

module.exports = {
    init: co(function*(args) {
        log.info("Loading configuration from " + args.config + "...");

        let defaults = JSON.parse(yield fs.readFileAsync(__dirname + "/../conf/defaults.json"));
        let config = JSON.parse(yield fs.readFileAsync(args.config));
        extend(true, module.exports, defaults, config, args);

        return module.exports;
    })
};
