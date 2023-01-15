"use strict";

const assert = require("assert");
const amqp = require("amqplib");
const { v4: uuid } = require("uuid");
const configuration = require("../config");
const Deferred = require("../lib/Deferred");
const { Client } = require("../auth");
const mb = require("../mb");

class Api {
    constructor() {
        this._functions = {};
        this._calls = {};

        this.api = new Proxy({}, {
            get: (target, key) => {
                if (!this._functions[key]) {
                    return undefined;
                }

                // return this._functions[key];

                return async (client, ...args) => this.call(key, client, args);
            }
        });
    }

    async init() {}

    async call(name, client, args) {
        const id = uuid();

        this._calls[id] = new Deferred();
        const sessionId = client.getId();

        await mb.sendToQueue(`api-${name}`, {
            id,
            sessionId,
            args
        });

        console.log(`CALL[${id}]:`, name, sessionId, args);

        return this._calls[id].promise;
    }

    async register(name, fn) {
        assert(!this._functions[name], `A api with the name ${name} is already registered`);

        this._functions[name] = fn;

        mb.on(`api-${name}`, async ({ id, sessionId, args }) => {
            if (this._calls[id]) {
                const d = this._calls[id];
                delete this._calls[id];

                try {
                    const client = await Client.create(sessionId);

                    const result = await this._functions[name](client, ...args);

                    console.log(`RESULT[${id}]:`, sessionId, result);
                    d.resolve(result);
                } catch (error) {
                    console.log(`ERROR[${id}]:`, sessionId);
                    d.reject(error);
                }
            }
        });
    }

    async stop() {}
}

module.exports = new Api();
