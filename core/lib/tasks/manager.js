"use strict";

const core = require("../core");
const Task = require("./task");
const log = require("../log")(module);

class TaskManager {
    constructor() {
        this.tasks = [];
    }

    async init() {
        log.info("Initializing task manager...");

        for (const [ name, command ] of Object.entries(core.commands)) {
            if (name.startsWith("task_")) {
                log.info(`Starting task: ${name}`);

                const task = new Task(command);

                this.tasks.push(task);

                await task.init();
            }
        }

        log.info("All tasks started.");
    }

    async stop() {
        await Promise.all(this.tasks.map((task) => task.stop()));
    }
}

module.exports = new TaskManager();
