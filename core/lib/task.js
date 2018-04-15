"use strict";

const log = require("./log")(module);
const { auth } = require("../../vfs");

const NEXT_RUN_TIMEOUT = 1000 * 60;
const ERROR_TIMEOUT = 1000 * 10;
const IDLE_TIMEOUT = 1000;

class Task {
    constructor(command) {
        this.command = command;
        this.stopped = false;
        this.timer = null;
    }

    init() {
        this.check();
    }

    async check() {
        this.timer = null;

        if (this.stopped) {
            return;
        }

        try {
            const didWork = await this.command(auth.ADMIN_SESSION);

            this.timer = setTimeout(() => this.check(), didWork ? IDLE_TIMEOUT : NEXT_RUN_TIMEOUT);
        } catch (error) {
            log.error(`Task failed, will wait ${ERROR_TIMEOUT / 1000}s until next run`, error);
            this.timer = setTimeout(() => this.check(), ERROR_TIMEOUT);
        }
    }

    async stop() {
        this.stopped = true;

        this.timer && clearTimeout(this.timer);
        this.timer = null;
    }
}

module.exports = Task;
