import { configInit } from "./config/index.mjs";
import db from "./db/index.mjs";
import media from "./media/index.mjs";
import commander from "./commander/index.mjs";
import packages from "./packages/index.mjs";
import taskManager from "./tasks/index.mjs";
import httpServer from "./http/index.mjs";
import bus from "./bus/index.mjs";
import mb from "./mb/index.mjs";
import store from "./store/index.mjs";
import { initLog, createLog } from "./lib/log.mjs";

const log = createLog(import.meta.url);


const start = async (args) => {
    await initLog(args.level);
    await configInit(args);
    await db.init();
    await mb.init();
    await store.init();
    await media.init();
    await commander.init();
    await packages.init();
    await taskManager.init();
    await httpServer.init();

    log.info("Initialization complete, core running.");
    await bus.open();
};

const stop = async () => {
    log.info("Received shutdown signal, stopping...");
    await taskManager.stop();
    await httpServer.stop();
    await mb.stop();
    await media.stop();
    await store.stop();
    await db.stop();
};

export {
    start,
    stop
};
