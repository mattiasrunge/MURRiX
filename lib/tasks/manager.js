"use strict";

const core = require("../core");
const Task = require("./task");

class TaskManager {
    constructor() {
        this.tasks = [];
    }

    async init() {
        for (const [ , ns ] of Object.entries(core.namespaces)) {
            for (const [ name, command ] of Object.entries(ns)) {
                if (name.startsWith("task_")) {
                    const task = new Task(command);

                    this.tasks.push(task);

                    await task.init();
                }
            }
        }
    }

    async stop() {
        await Promise.all(this.tasks.map((task) => task.stop()));
    }
}

module.exports = new TaskManager();