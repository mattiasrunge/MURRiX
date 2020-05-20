"use strict";

const log = require("../log")(module);
const { ADMIN_CLIENT } = require("../core/auth");

const NEXT_RUN_TIMEOUT = 1000 * 60;
const ERROR_TIMEOUT = 1000 * 10;
const IDLE_TIMEOUT = 1000;

class Task {
    constructor(name, command) {
        this.name = name;
        this.command = command;
        this.stopped = true;
        this.timer = null;
    }

    start() {
        if (!this.stopped) {
            return;
        }

        log.info(`Task ${this.name} started...`);

        this.stopped = false;

        this.check();
    }

    async check() {
        this.timer = null;

        if (this.stopped) {
            return;
        }

        try {
            const didWork = await this.command(ADMIN_CLIENT);

            this.timer = setTimeout(() => this.check(), didWork ? IDLE_TIMEOUT : NEXT_RUN_TIMEOUT);
        } catch (error) {
            log.error(`Task failed, will wait ${ERROR_TIMEOUT / 1000}s until next run`, error);
            this.timer = setTimeout(() => this.check(), ERROR_TIMEOUT);
        }
    }

    status() {
        return {
            running: !this.stopped
        };
    }

    async stop() {
        this.stopped = true;

        this.timer && clearTimeout(this.timer);
        this.timer = null;

        log.info(`Task ${this.name} stopped...`);
    }
}

module.exports = Task;
