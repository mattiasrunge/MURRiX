"use strict";

const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const bus = require("./bus");
const server = require("./http-server");
const db = require("./db");
const session = require("./session");
const plugin = require("./plugin");

module.exports = {
    start: async (args) => {
        await logger.init(args.level);
        await configuration.init(args);
        await db.init(configuration);
        await bus.init(configuration);
        await session.init(configuration);
        await plugin.init(configuration);
        await server.init(configuration);

        log.info("Initialization complete, core running.");
        bus.open();
    },
    stop: async () => {
        log.info("Received shutdown signal, stopping...");
        await server.stop();
        await session.stop();
        await db.stop();
    }
};
