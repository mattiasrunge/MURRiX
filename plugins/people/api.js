"use strict";

const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let people = api.register("people", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/people", true))) {
            yield vfs.create(auth.getAdminSession(), "/people", "d");
        }
    }),
    mkperson: function*(session, name, attributes) {
        let person = yield vfs.create(session, "/people/" + name, "p", attributes);

        yield vfs.create(session, "/people/" + name + "/parents", "d");
        yield vfs.create(session, "/people/" + name + "/children", "d");
        yield vfs.create(session, "/people/" + name + "/homes", "d");

        return person;
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/people/" + name, true);
    }
});

module.exports = people;
