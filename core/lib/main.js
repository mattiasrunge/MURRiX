"use strict";

const co = require("bluebird").coroutine;
const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const bus = require("./bus");
const server = require("./http-server");
const db = require("./db");
const session = require("./session");
const plugin = require("./plugin");

module.exports = {
    start: co(function*(args) {
        yield logger.init(args.level);
        yield configuration.init(args);
        yield db.init(configuration);
        yield bus.init(configuration);
        yield session.init(configuration);
        yield plugin.init(configuration);
        yield server.init(configuration);

        log.info("Initialization complete, core running.");
        bus.open();
    }),
    stop: co(function*() {
        log.info("Received shutdown signal, stopping...");
        yield server.stop();
        yield session.stop();
        yield db.stop();
    })
};
