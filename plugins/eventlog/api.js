"use strict";

const api = require("api.io");
const bus = require("../../lib/bus");
const db = require("../../lib/db");

let params = {};

const eventlog = api.register("eventlog", {
    deps: [ ],
    init: async (config) => {
        params = config;

        bus.on("*", eventlog._save);
    },
    _save: async (event, data) => {
        await db.insertOne("eventlog", {
            _id: data._id,
            when: new Date(),
            event: event,
            data: data
        });
    }
});

module.exports = eventlog;
