"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const mfw = require("mfw");
const db = require("./db");
const vfs = require("./vfs");

module.exports = {
    start: co(function*(args, version) {
        yield logger.init(args.level);
        yield configuration.init(args);

        yield db.init(configuration);
        yield vfs.init(configuration);
        yield mfw.init({
            name: "murrix",
            version: version,
            port: configuration.port,
            api: require("./http-api"),
            routes: require("./http-routes"),
            client: path.join(__dirname, "..", "www"),
            uploadDirectory: configuration.uploadDirectory,
            bableCompileDirectory: configuration.bableCompileDirectory
        });
        yield mfw.start();
    }),
    stop: co(function*() {
        log.info("Received shutdown signal, stoppping...");
        yield mfw.stop();
    })
};
