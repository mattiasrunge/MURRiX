"use strict";

const co = require("bluebird").coroutine;
const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const server = require("./http-server");
const db = require("./db");
const plugin = require("./plugin");

module.exports = {
    start: co(function*(args, version) {
        yield logger.init(args.level);
        yield configuration.init(args);
        yield db.init(configuration);
        yield plugin.init(configuration);
        yield server.init(configuration, version);

        plugin.resumeEvents();
    }),
    stop: co(function*() {
        log.info("Received shutdown signal, stoppping...");
        yield server.stop();
        yield db.stop();
    })
};
