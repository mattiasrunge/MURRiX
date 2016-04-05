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
        let uninitializedApis = [];
        let initializedApiNames = [];

        for (let filename of filenames) {
            console.log("Loading plugin from " + filename);
            uninitializedApis.push(require(filename));
        }

        // TODO: Create safeguard for circular dependencies
        while (uninitializedApis.length > 0) {
            let apiInstance = uninitializedApis.shift();

            if (apiInstance.deps.filter((namespace) => initializedApiNames.indexOf(namespace) === -1).length > 0) {
                uninitializedApis.push(apiInstance);
            } else {
                console.log("Initializing " + apiInstance.namespace);
                yield apiInstance.init(configuration);
                initializedApiNames.push(apiInstance.namespace);
            }
        }
    }),
    stop: co(function*() {
        log.info("Received shutdown signal, stoppping...");
        yield server.stop();
        yield db.stop();
    })
};
