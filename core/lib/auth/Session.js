"use strict";

const store = require("../store");

class Session {
    static async create(id, initialData = {}) {
        // TODO: Fetch from redis
        const storedData = (await store.get(`session-${id}`)) || {};
        const sessionData = {
            ...storedData,
            ...initialData,
            id
        };

        await store.set(`session-${id}`, sessionData);

        return new Session(sessionData);
    }

    constructor(session) {
        return new Proxy(this, {
            get: (target, name) => session[name],
            set: async (target, name, value) => {
                try {
                    if (name === "destroy") {
                        await store.unset(`session-${session.id}`);

                        return true;
                    }

                    if (session[name] !== value) {
                        session[name] = value;

                        if (store.isConnected()) {
                            await store.set(`session-${session.id}`, session);
                        }
                    }
                } catch (error) {
                    console.error("Failed to update session", error);

                    return false;
                }

                return true;
            },
            ownKeys: () => Object.keys(session),
            getOwnPropertyDescriptor: (target, name) => ({
                enumerable: true,
                configurable: true,
                value: session[name]
            })
        });
    }
}

module.exports = Session;
