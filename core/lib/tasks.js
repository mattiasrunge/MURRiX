"use strict";

const { vfs } = require("../../vfs");
const Task = require("./task");

class Tasks {
    constructor() {
        this.tasks = [];
    }

    async init() {
        for (const [ , ns ] of Object.entries(vfs.namespaces)) {
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

module.exports = new Tasks();
