"use strict";

const path = require("path");
const moment = require("moment");
const api = require("api.io");
const bus = require("../../lib/bus");

let params = {};

const comment = api.register("comment", {
    deps: [ "vfs", "auth" ],
    init: async (config) => {
        params = config;
    },
    comment: api.export(async (session, abspath, text) => {
        if (!(await api.vfs.access(session, abspath, "r"))) {
            throw new Error("Permission denied");
        }

        let name = moment().format();
        await api.vfs.ensure(api.auth.getAdminSession(), path.join(abspath, "comments"), "d");

        session.almighty = true;
        let item = await api.vfs.create(session, path.join(abspath, "comments", name), "k", {
            text: text
        });
        session.almighty = false;

        bus.emit("comment.new", {
            uid: session.uid,
            path: abspath,
            text: item.attributes.text
        });

        comment.emit("new", { name: name, node: item, path: abspath });

        return comment;
    }),
    list: api.export(async (session, abspath) => {
        if (!(await api.vfs.access(session, abspath, "r"))) {
            throw new Error("Permission denied");
        }

        let dir = await api.vfs.resolve(api.auth.getAdminSession(), path.join(abspath, "comments"), { noerror: true });

        if (!dir) {
            return [];
        }

        return await api.vfs.list(api.auth.getAdminSession(), path.join(abspath, "comments"));
    })
});

module.exports = comment;
