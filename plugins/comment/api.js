"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");

let params = {};

let comment = api.register("comment", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;
    }),
    comment: function*(session, abspath, text) {
        if (!(yield api.vfs.access(session, abspath, "r"))) {
            throw new Error("Permission denied");
        }

        let name = moment().format();
        yield api.vfs.ensure(api.auth.getAdminSession(), path.join(abspath, "comments"), "d");

        session.almighty = true;
        let comment = yield api.vfs.create(session, path.join(abspath, "comments", name), "c", {
            text: text
        });
        session.almighty = false;

        return comment;
    },
    list: function*(session, abspath) {
        if (!(yield api.vfs.access(session, abspath, "r"))) {
            throw new Error("Permission denied");
        }

        yield api.vfs.ensure(api.auth.getAdminSession(), path.join(abspath, "comments"), "d");

        return yield api.vfs.list(api.auth.getAdminSession(), path.join(abspath, "comments"));
    }
});

module.exports = comment;
