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
        plugin.on("album.new", feed.onNewAlbum);
        plugin.on("location.new", feed.onNewLocation);
        plugin.on("people.new", feed.onNewPerson);

        if (!(yield vfs.resolve(auth.getAdminSession(), "/news", true))) {
            yield vfs.create(auth.getAdminSession(), "/news", "d");
            yield vfs.chown(auth.getAdminSession(), "/news", "admin", "users");
            yield vfs.chmod(auth.getAdminSession(), "/news", "770");
        }
    }),
    getLatest: co(function*() {
        let list = yield feed.list(auth.getAdminSession(), { limit: 1 });
        return list[0];
    }),
    onNewPerson: co(function*(event, data) {
        let name = moment().format();
        let abspath = path.join("/news", name);

        let news = yield vfs.create(auth.getAdminSession(), abspath, "n", {
            events: [ data._id ],
            type: "p",
            action: "created",
            path: data.path,
            uid: data.uid
        });

        feed.emit("new", { name: name, node: news, path: abspath });
    }),
    onNewLocation: co(function*(event, data) {
        let name = moment().format();
        let abspath = path.join("/news", name);

        let news = yield vfs.create(auth.getAdminSession(), abspath, "n", {
            events: [ data._id ],
            type: "l",
            action: "created",
            path: data.path,
            uid: data.uid
        });

        feed.emit("new", { name: name, node: news, path: abspath });
    }),
    onNewAlbum: co(function*(event, data) {
        let name = moment().format();
        let abspath = path.join("/news", name);

        let news = yield vfs.create(auth.getAdminSession(), abspath, "n", {
            events: [ data._id ],
            type: "a",
            action: "created",
            path: data.path,
            uid: data.uid
        });

        feed.emit("new", { name: name, node: news, path: abspath });
    }),
    onNewComment: co(function*(event, data) {
        let latest = yield feed.getLatest();
        let node = yield vfs.resolve(auth.getAdminSession(), data.path);

        if (latest &&
            latest.node.attributes.type === node.properties.type &&
            latest.node.attributes.path === data.path) {
            return;
        }

        let name = moment().format();
        let abspath = path.join("/news", name);

        let news = yield vfs.create(auth.getAdminSession(), abspath, "n", {
            events: [ data._id ],
            type: node.properties.type,
            action: "comment",
            path: data.path,
            uid: data.uid
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
