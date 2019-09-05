"use strict";

const configuration = require("./configuration");
const logger = require("./log");
const log = logger(module);
const httpServer = require("./http/server");
// const sftpServer = require("./sftp/server");
const db = require("./core/db");
const media = require("./media");
const taskManager = require("./tasks/manager");

const core = require("./core");
const bus = require("./core/bus");

require("./packages/vfs");
require("./packages/geolocation");
require("./packages/statistics");
require("./packages/media");
require("./packages/murrix");

module.exports = {
    start: async (args) => {
        await logger.init(args.level);
        await configuration.init(args);
        await db.init(configuration);
        await media.init(configuration);
        await core.init();
        await taskManager.init();
        await httpServer.init(configuration);
        // await sftpServer.init(configuration);

        log.info("Initialization complete, core running.");
        await bus.open();
    },
    stop: async () => {
        log.info("Received shutdown signal, stopping...");
        await taskManager.stop();
        // await sftpServer.stop();
        await httpServer.stop();
        await media.stop();
        await db.stop();
    }
};
