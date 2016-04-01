"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const glob = require("glob-promise");
const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const server = require("./http-server");
const db = require("./db");

module.exports = {
    start: co(function*(args, version) {
        yield logger.init(args.level);
        yield configuration.init(args);
        yield db.init(configuration);
        yield module.exports.loadPlugins();
        yield server.init(configuration, version);
    }),
    loadPlugins: co(function*() {
        let pattern = path.join(__dirname, "..", "..", "plugins", "**", "api.js");
        let filenames = yield glob(pattern);

        for (let filename of filenames) {
            let api = require(filename);
            yield api.init(configuration);
        }
    }),
    stop: co(function*() {
        log.info("Received shutdown signal, stoppping...");
        yield server.stop();
    })
};
