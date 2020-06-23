"use strict";

const log = require("../lib/log")(module);
const { ADMIN_CLIENT } = require("../auth");
const { api } = require("../api");

const NEXT_RUN_TIMEOUT = 1000 * 60;
const ERROR_TIMEOUT = 1000 * 10;
const IDLE_TIMEOUT = 1000;

class Task {
    constructor(node) {
        this.node = node;
        this.stopped = false;
        this.timer = null;
    }

    start() {
        log.info(`Task ${this.node.name} started`);

        this.stopped = false;
        this.check();
    }

    update(node) {
        this.node = node;
    }

    async check() {
        this.timer = null;

        if (this.stopped) {
            return;
        }

        const idleTimeout = this.node.attributes.idleTimeout ?? IDLE_TIMEOUT;
        const nextRunTimeout = this.node.attributes.nextRunTimeout ?? NEXT_RUN_TIMEOUT;
        const errorTimeout = this.node.attributes.errorTimeout ?? ERROR_TIMEOUT;

        try {
            // TODO: Use commands instead of api when pipes are supported
            // findallfileswithoutchecksum | head -n 1 | ensurechecksum
            // findfileswithmissingcache | head -n 1 | cache
            // findfileswitoutfaces | head -n 1 | findfaces

            const t1 = Date.now();
            const didWork = await api[this.node.attributes.command](ADMIN_CLIENT, this.node);
            const lastDuration = Date.now() - t1;

            await api.update(ADMIN_CLIENT, this.node.path, { lastDuration, didWork, error: null });

            this.timer = setTimeout(() => this.check(), didWork ? idleTimeout : nextRunTimeout);
        } catch (error) {
            log.error(`Task failed, will wait ${errorTimeout / 1000}s until next run`, error);

            const errorStack = error.stack ? error.stack.toString().split("\n").map((l) => l.trim()).filter(Boolean) : [];

            await api.update(ADMIN_CLIENT, this.node.path, { lastDuration: false, didWork: false, error: errorStack });

            this.timer = setTimeout(() => this.check(), errorTimeout);
        }
    }

    async stop() {
        this.stopped = true;

        this.timer && clearTimeout(this.timer);
        this.timer = null;

        log.info(`Task ${this.node.name} stopped`);
    }
}

module.exports = Task;
