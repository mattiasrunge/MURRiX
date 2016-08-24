"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const plugin = require("../../core/lib/plugin");

let params = {};

let comment = api.register("comment", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;
    }),
    comment: function*(session, abspath, text) {
        if (!(yield api.api.vfs.access(session, abspath, "r"))) {
            throw new Error("Permission denied");
        }

        let name = moment().format();
        yield api.vfs.ensure(api.auth.getAdminSession(), path.join(abspath, "comments"), "d");

        session.almighty = true;
        let item = yield api.vfs.create(session, path.join(abspath, "comments", name), "k", {
            text: text
        });
        session.almighty = false;

        plugin.emit("comment.new", {
            uid: session.uid,
            path: abspath,
            text: item.attributes.text
        });

        comment.emit("new", { name: name, node: item, path: abspath });

        return comment;
    },
    list: function*(session, abspath) {
        if (!(yield api.vfs.access(session, abspath, "r"))) {
            throw new Error("Permission denied");
        }

        let dir = yield api.vfs.resolve(api.auth.getAdminSession(), path.join(abspath, "comments"), { noerror: true });

        if (!dir) {
            return [];
        }

        return yield api.vfs.list(api.auth.getAdminSession(), path.join(abspath, "comments"));
    }
});

module.exports = comment;
