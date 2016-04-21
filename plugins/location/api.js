"use strict";

const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let location = api.register("location", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/locations", true))) {
            yield vfs.create(auth.getAdminSession(), "/locations", "d");
            yield vfs.chown(auth.getAdminSession(), "/locations", "admin", "users");
        }
    }),
    mklocation: function*(session, name, attributes) {
        let location = yield vfs.create(session, "/locations/" + name, "l", attributes);

        yield vfs.create(session, "/locations/" + name + "/residents", "d");

        return location;
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/locations/" + name, true);
    }
});

module.exports = location;
