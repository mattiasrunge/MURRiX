"use strict";

const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let album = api.register("album", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/albums", true))) {
            yield vfs.create(auth.getAdminSession(), "/albums", "d");
            yield vfs.chown(auth.getAdminSession(), "/albums", "admin", "users");
        }
    }),
    mkalbum: function*(session, name, attributes) {
        let album = yield vfs.create(session, "/albums/" + name, "a", attributes);

        yield vfs.create(session, "/albums/" + name + "/residents", "d");

        return album;
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/albums/" + name, true);
    }
});

module.exports = album;
