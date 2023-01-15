"use strict";

const logger = require("./lib/log");
const configuration = require("./config");
const db = require("./db");
const media = require("./media");
const commander = require("./commander");
const packages = require("./packages");
const taskManager = require("./tasks");
const httpServer = require("./http");
// const sshServer = require("./ssh");
const bus = require("./bus");
const api = require("./api");
const mb = require("./mb");
const store = require("./store");

const log = logger(module);

module.exports = {
    start: async (args) => {
        await logger.init(args.level);
        await configuration.init(args);
        await db.init();
        await mb.init();
        await store.init();
        await api.init();
        await media.init();
        await commander.init();
        await packages.init();
        await taskManager.init();
        await httpServer.init();
        // await sshServer.init();

        log.info("Initialization complete, core running.");
        await bus.open();
    },
    stop: async () => {
        log.info("Received shutdown signal, stopping...");
        await api.stop();
        await taskManager.stop();
        // await sshServer.stop();
        await httpServer.stop();
        await mb.stop();
        await media.stop();
        await store.stop();
        await db.stop();
    }
};
