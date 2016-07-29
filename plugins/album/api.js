"use strict";

const path = require("path");
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
        yield vfs.create(session, "/albums/" + name, "a", attributes);

        yield vfs.create(session, "/albums/" + name + "/files", "d");
        yield vfs.create(session, "/albums/" + name + "/texts", "d");

        return yield vfs.resolve(session, "/albums/" + name);
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/albums/" + name, true);
    },
    findByYear: function*(session, year) {
        console.time("album.findByYear total " + year);
        console.time("album.findByYear ftIds");
        year = parseInt(year, 10);

        let list = [];
        let cache = {};

        let options = {
            fields: {
                "_id": 1
            }
        };

        let query = {
            "properties.type": { $in: [ "f", "t" ] },
            "attributes.time.timestamp": {
                $gte: moment.utc({ year: year }).unix(),
                $lt: moment.utc({ year: year + 1 }).unix()
            }
        };

        let ftNodes = yield vfs.query(session, query, options);
        let ftIds = ftNodes.map((node) => node._id);

        console.timeEnd("album.findByYear ftIds");
        console.time("album.findByYear dIds");

        query = {
            "properties.type": "d",
            "properties.children.id": { $in: ftIds }
        };

        let dNodes = yield vfs.query(session, query, options);
        let dIds = dNodes.map((node) => node._id);

        console.timeEnd("album.findByYear dIds");
        console.time("album.findByYear aNodes");

        query = {
            "properties.type": "a",
            "properties.children.id": { $in: dIds }
        };

        let aNodes = yield vfs.query(session, query);

        console.timeEnd("album.findByYear aNodes");
        console.time("album.findByYear lookup");

        for (let node of aNodes) {
            let paths = yield vfs.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        console.timeEnd("album.findByYear lookup");
        console.timeEnd("album.findByYear total " + year);

        return list;
    }
});

module.exports = album;
