
import assert from "node:assert";
import { v4 as uuid } from "uuid";
import Deferred from "../lib/Deferred.mjs";
import { Client } from "../auth/index.mjs";
import mb from "../mb/index.mjs";

class Api {
    constructor() {
        this._functions = {};
        this._calls = {};
    }

    async call(name, client, args) {
        const id = uuid();

        this._calls[id] = new Deferred();
        const sessionId = client.getId();

        await mb.sendToQueue(`api-${name}`, {
            id,
            sessionId,
            args
        });

        // console.log(`CALL[${id}]:`, name, sessionId, args);

        const result = await this._calls[id].promise;

        await client.sync();

        return result;
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

                    // console.log(`RESULT[${id}]:`, sessionId, result);
                    d.resolve(result);
                } catch (error) {
                    // console.log(`ERROR[${id}]:`, sessionId);
                    d.reject(error);
                }
            }
        });
    }
}

const apiObj = new Api();

const api = new Proxy({}, {
    get: (target, key) => {
        if (!apiObj._functions[key]) {
            return undefined;
        }

        // return this._functions[key];

        return async (client, ...args) => apiObj.call(key, client, args);
    },
    has(_, key) {
        return key in apiObj._functions;
    }
});

apiObj.api = api;

export default apiObj;
export { api };

