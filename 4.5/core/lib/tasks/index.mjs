import { api } from "../api/index.mjs";
import { getAdminClient } from "../auth/index.mjs";
import bus from "../bus/index.mjs";
import Task from "./Task.mjs";
import { createLog } from "../lib/log.mjs";

const log = createLog(import.meta.url);
class TaskManager {
    constructor() {
        this.tasks = {};
    }

    async init() {
        log.info("Initializing task manager...");

        bus.on("node.create", (e, { node }) => this._addTask(node));
        bus.on("node.update", (e, { node }) => this._updateTask(node));
        bus.on("node.remove", (e, { node }) => this._removeTask(node));

        const nodes = await api.list(await getAdminClient(), "/system/tasks");

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

export default new TaskManager();
