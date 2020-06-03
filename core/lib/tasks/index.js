"use strict";

const { api } = require("../api");
const { ADMIN_CLIENT } = require("../auth");
const bus = require("../bus");
const log = require("../lib/log")(module);
const Task = require("./task");

class TaskManager {
    constructor() {
        this.tasks = {};
    }

    async init() {
        log.info("Initializing task manager...");

        bus.on("node.create", (e, { node }) => this._addTask(node));
        bus.on("node.update", (e, { node }) => this._updateTask(node));
        bus.on("node.remove", (e, { node }) => this._removeTask(node));

        const nodes = await api.list(ADMIN_CLIENT, "/system/tasks");

        for (const node of nodes) {
            await this._addTask(node);
        }
    }

    _addTask(node) {
        if (node.attributes.enabled && !this.tasks[node.name]) {
            this.tasks[node.name] = new Task(node);

            this.tasks[node.name].start();
        }
    }

    _updateTask(node) {
        if (!node.attributes.enabled && this.tasks[node.name]) {
            this._removeTask(node);
        } else if (node.attributes.enabled && !this.tasks[node.name]) {
            this._addTask(node);
        } else if (this.tasks[node.name]) {
            this.tasks[node.name].update(node);
        }
    }

    _removeTask(node) {
        const task = this.tasks[node.name];

        if (task) {
            delete this.tasks[node.name];

            task.stop();
        }
    }

    async stop() {
        Object.values(this.tasks).map((task) => task.stop());
        this.tasks = {};
    }
}

module.exports = new TaskManager();
