"use strict";

const assert = require("assert");
const core = require("../core");
const Task = require("./task");
const log = require("../log")(module);

class TaskManager {
    constructor() {
        this.tasks = {};
    }

    async init() {
        log.info("Initializing task manager...");

        for (const [ name, command ] of Object.entries(core.commands)) {
            if (name.startsWith("task_")) {
                const niceName = name.slice(5);

                log.info(`Starting task: ${niceName}`);

                this.tasks[niceName] = new Task(niceName, command);

                await this.tasks[niceName].start();
            }
        }

        log.info("All tasks started.");
    }

    async stopTask(name) {
        assert(this.tasks[name], `No task named ${name} found`);

        await this.tasks[name].stop();
    }

    async startTask(name) {
        assert(this.tasks[name], `No task named ${name} found`);

        await this.tasks[name].start();
    }

    async listTasks() {
        return Object.fromEntries(Object.entries(this.tasks).map(([ name, task ]) => ([ name, task.status() ])));
    }

    async stop() {
        await Promise.all(Object.values(this.tasks).map((task) => task.stop()));
    }
}

module.exports = new TaskManager();
