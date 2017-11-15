"use strict";

const uuid = require("uuid");
const log = require("./log")(module);

let params = {};
let handlers = {};
let buffer = [];
let opened = false;

module.exports = {
    init: async (config) => {
        params = config;
    },
    open: () => {
        if (opened) {
            return;
        }

        opened = true;

        for (let item of buffer) {
            module.exports._emit(item.event, item.data);
        }

        buffer = [];
    },
    on: (event, handler) => {
        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);
    },
    _emit: (event, data) => {
        if (opened) {
            if (handlers["*"]) {
                process.nextTick(() => {
                    for (let handler of handlers["*"]) {
                        handler(event, data).catch((error) => {
                            log.error("Failed to handle event, error: ", error);
                        });
                    }
                });
            }

            if (handlers[event]) {
                process.nextTick(() => {
                    for (let handler of handlers[event]) {
                        handler(event, data).catch((error) => {
                            log.error("Failed to handle event, error: ", error);
                        });
                    }
                });
            }
        } else {
            return buffer.push({ event: event, data: data });
        }
    },
    emit: (event, data) => {
        data = Object.assign({}, data, { _id: uuid.v4() });

        //log.debug("plugin-event[" + event + "]: " + JSON.stringify(data, null, 2));

        module.exports._emit(event, data);
    }
};
