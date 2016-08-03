"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const plugin = require("../../core/lib/plugin");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let feed = api.register("feed", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        plugin.on("comment.new", feed.onNewComment);

        if (!(yield vfs.resolve(auth.getAdminSession(), "/news", true))) {
            yield vfs.create(auth.getAdminSession(), "/news", "d");
            yield vfs.chown(auth.getAdminSession(), "/news", "admin", "users");
            yield vfs.chmod(auth.getAdminSession(), "/news", "770");
        }
    }),
    onNewComment: co(function*(event, data) {
        console.log("onNewComment", event, data);

        let name = moment().format();
        let abspath = path.join("/news", name);

        let news = yield vfs.create(auth.getAdminSession(), abspath, "n", {
            events: [ data._id ],
            who: data.uid,
            type: "comment",
            path: data.path,
            text: data.text
        });

        feed.emit("new", { name: name, node: news, path: abspath });
    }),
    list: function*(session, options) {
        options = options || {};

        options.reverse = true;

        return yield vfs.list(session, "/news", options);
    }
});

module.exports = feed;
