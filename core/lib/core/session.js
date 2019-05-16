"use strict";

class Session {
    constructor(data, client) {
        return new Proxy(this, {
            get: (target, name) => data[name],
            set: (target, name, value) => {
                if (data[name] !== value) {
                    data[name] = value;

                    client && client.sessionUpdated();
                }

                return true;
            },
            ownKeys: () => Object.keys(data),
            getOwnPropertyDescriptor: (target, name) => ({
                enumerable: true,
                configurable: true,
                value: data[name]
            })
        });
    }
}

module.exports = Session;
