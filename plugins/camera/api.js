"use strict";

const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let camera = api.register("camera", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/cameras", true))) {
            yield vfs.create(auth.getAdminSession(), "/cameras", "d");
            yield vfs.chown(auth.getAdminSession(), "/cameras", "admin", "users");
        }
    }),
    mkcamera: function*(session, name, attributes) {
        yield vfs.create(session, "/cameras/" + name, "c", attributes);

        yield vfs.create(session, "/cameras/" + name + "/owners", "d");

        return yield vfs.resolve(session, "/cameras/" + name);
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/cameras/" + name, true);
    }
});

module.exports = camera;