"use strict";

const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let event = api.register("event", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/events", true))) {
            yield vfs.create(auth.getAdminSession(), "/events", "d");
            yield vfs.chown(auth.getAdminSession(), "/events", "admin", "users");
        }
    }),
    mkevent: function*(session, name, attributes) {
        let item = yield vfs.create(session, "/events/" + name, "e", attributes);

        yield vfs.create(session, "/events/" + name + "/tags", "d");

        return item;
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/events/" + name, true);
    }
});

module.exports = event;
