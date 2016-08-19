"use strict";

const path = require("path");
const events = require("events");
const pauseable = require("pauseable");
const glob = require("glob-promise");
const uuid = require("node-uuid");
const co = require("bluebird").coroutine;
const log = require("./log")(module);
const db = require("./db");

let params = {};
let emitter = new events.EventEmitter();

module.exports = {
    init: co(function*(config) {
        params = config;

        let pattern = path.join(__dirname, "..", "..", "plugins", "**", "api.js");
        let filenames = yield glob(pattern);
        let uninitializedApis = [];
        let initializedApiNames = [];

        for (let filename of filenames) {
            log.info("Loading plugin from " + filename);
            uninitializedApis.push(require(filename));
        }

        while (uninitializedApis.length > 0) {
            let apiInstance = uninitializedApis.shift();

            if (apiInstance.deps.filter((namespace) => !initializedApiNames.includes(namespace)).length > 0) {
                uninitializedApis.push(apiInstance);
            } else {
                log.info("Initializing " + apiInstance.namespace);
                yield apiInstance.init(params);
                initializedApiNames.push(apiInstance.namespace);
            }
        }
    }),
    pauseEvents: () => {
        pauseable.pause(emitter);
    },
    resumeEvents: () => {
        pauseable.resume(emitter);
    },
    on: (event, handler) => {
        emitter.on(event, (data) => {
            handler(event, data)
            .catch((error) => {
                log.error("Failed to handle event, error: ", error);
            });
        });
    },
    emit: (event, data) => {
        let id = uuid.v4();

        log.debug("plugin-event[" + event + "]: " + JSON.stringify(data, null, 2));

        db.insertOne("eventlog", {
            _id: id,
            when: new Date(),
            event: event,
            data: data
        })
        .catch((error) => {
            log.error("Failed to add to event log, error:" + error);
        });

        process.nextTick(() => {
            emitter.emit(event, Object.assign({}, data, { _id: id }));
        });
    }
};

module.exports.pauseEvents();
