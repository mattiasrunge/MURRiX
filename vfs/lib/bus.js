"use strict";

const uuid = require("uuid");

class Bus {
    constructor() {
        this.handlers = {};
        this.buffer = [];
        this.opened = false;
    }

    async init() {}

    async open() {
        if (this.opened) {
            return;
        }

        this.opened = true;

        while (this.buffer.length > 0) {
            const item = this.buffer.shift();
            await this._emit(item.event, item.data);
        }
    }

    on(event, handler) {
        this.handlers[event] = this.handlers[event] || [];
        this.handlers[event].push(handler);
    }

    _printError(error) {
        console.error("Failed to handle event, error: ", error);
    }

    async _emit(event, data) {
        if (!this.opened) {
            return this.buffer.push({ event: event, data: data });
        }

        const handlerList = [];

        this.handlers["*"] && handlerList.push(...this.handlers["*"]);
        this.handlers[event] && handlerList.push(...this.handlers[event]);

        for (const handler of handlerList) {
            try {
                await Promise.resolve(handler(event, data));
            } catch (error) {
                this._printError(error);
            }
        }
    }

    async emit(event, data) {
        return this._emit(event, {
            ...data,
            _id: uuid.v4()
        });
    }
}

module.exports = new Bus();
