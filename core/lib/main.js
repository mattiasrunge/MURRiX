"use strict";

const configuration = require("./lib/configuration");
const logger = require("./lib/log");
const log = logger(module);
const commander = require("./commander");
const httpServer = require("./http/server");
const sshServer = require("./ssh/server");
const db = require("./lib/db");
const media = require("./lib/media");
const taskManager = require("./tasks/manager");

const packages = require("./packages");
const bus = require("./lib/bus");

module.exports = {
    start: async (args) => {
        await logger.init(args.level);
        await configuration.init(args);
        await db.init(configuration);
        await media.init(configuration);
        await commander.init();
        await packages.init();
        await taskManager.init();
        await httpServer.init(configuration);
        await sshServer.init(configuration);

        log.info("Initialization complete, core running.");
        await bus.open();
    },
    stop: async () => {
        log.info("Received shutdown signal, stopping...");
        await taskManager.stop();
        await sshServer.stop();
        await httpServer.stop();
        await media.stop();
        await db.stop();
    }
};
