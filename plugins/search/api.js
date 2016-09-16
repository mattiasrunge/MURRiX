"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const log = require("../../core/lib/log")(module);

let params = {};

let search = api.register("search", {
    deps: [ "vfs" ],
    init: co(function*(config) {
        params = config;
    }),
    findByYear: function*(session, year) {
        log.profile("search.findByYear total " + year);
        log.profile("search.findByYear ftIds");
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

        let ftNodes = yield api.vfs.query(session, query, options);
        let ftIds = ftNodes.map((node) => node._id);

        log.profile("search.findByYear ftIds");
        log.profile("search.findByYear dIds");

        query = {
            "properties.type": "d",
            "properties.children.id": { $in: ftIds }
        };

        let dNodes = yield api.vfs.query(session, query, options);
        let dIds = dNodes.map((node) => node._id);

        log.profile("search.findByYear dIds");
        log.profile("search.findByYear aNodes");

        query = {
            "properties.type": "a",
            "properties.children.id": { $in: dIds }
        };

        let aNodes = yield api.vfs.query(session, query);

        log.profile("search.findByYear aNodes");
        log.profile("search.findByYear lookup");

        for (let node of aNodes) {
            let paths = yield api.vfs.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        log.profile("search.findByYear lookup");
        log.profile("search.findByYear total " + year);

        return list;
    }
});

module.exports = search;
