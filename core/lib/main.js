"use strict";

const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const server = require("./http-server");
const db = require("./db");
const media = require("./media");
const session = require("./session");
const apiExporter = require("./api-exporter");
const { vfs, bus } = require("../../vfs");
require("../../murrix");


module.exports = {
    start: async (args) => {
        await logger.init(args.level);
        await configuration.init(args);
        await db.init(configuration);
        await media.init(configuration);
        await vfs.init();
        await session.init();
        await apiExporter.init();
        await server.init(configuration);

        log.info("Initialization complete, core running.");
        await bus.open();
    },
    stop: async () => {
        log.info("Received shutdown signal, stopping...");
        await server.stop();
        await session.stop();
        await media.stop();
        await db.stop();
    }
};
