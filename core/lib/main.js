"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const co = require("bluebird").coroutine;
const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const server = require("./http-server");
const db = require("./db");
const vfs = require("./vfs");

module.exports = {
    start: co(function*(args, version) {
        yield logger.init(args.level);
        yield configuration.init(args);

        if (configuration.bableCompileDirectory) {
            yield fs.removeAsync(configuration.bableCompileDirectory);
        }

        yield db.init(configuration);
        yield vfs.init(configuration);
        yield server.init(configuration);
    }),
    stop: co(function*() {
        log.info("Received shutdown signal, stoppping...");
        yield server.stop();
    })
};
