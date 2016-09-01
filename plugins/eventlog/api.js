"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io");
const bus = require("../../core/lib/bus");
const db = require("../../core/lib/db");

let params = {};

let eventlog = api.register("eventlog", {
    deps: [ ],
    init: co(function*(config) {
        params = config;

        bus.on("*", eventlog._save);
    }),
    _save: co(function*(event, data) {
        yield db.insertOne("eventlog", {
            _id: data._id,
            when: new Date(),
            event: event,
            data: data
        });
    })
});

module.exports = eventlog;
