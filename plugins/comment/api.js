"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const plugin = require("../../core/lib/plugin");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

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
        yield vfs.ensure(auth.getAdminSession(), path.join(abspath, "comments"), "d");

        session.almighty = true;
        let item = yield vfs.create(session, path.join(abspath, "comments", name), "k", {
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
        if (!(yield vfs.access(session, abspath, "r"))) {
            throw new Error("Permission denied");
        }

        let dir = yield vfs.resolve(auth.getAdminSession(), path.join(abspath, "comments"), { noerror: true });

        if (!dir) {
            return [];
        }

        return yield vfs.list(auth.getAdminSession(), path.join(abspath, "comments"));
    }
});

module.exports = comment;
