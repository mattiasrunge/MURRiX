"use strict";

const path = require("path");
const moment = require("moment");
const api = require("api.io");
const log = require("../../lib/log")(module);

const search = api.register("search", {
    deps: [ "vfs" ],
    init: async (/* config */) => {},
    findByYear: api.export(async (session, year) => {
        log.profile(`search.findByYear total ${year}`);
        log.profile("search.findByYear ftIds");
        year = parseInt(year, 10);

        const list = [];
        const cache = {};

        const options = {
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

        const ftNodes = await api.vfs.query(session, query, options);
        const ftIds = ftNodes.map((node) => node._id);

        log.profile("search.findByYear ftIds");
        log.profile("search.findByYear dIds");

        query = {
            "properties.type": "d",
            "properties.children.id": { $in: ftIds }
        };

        const dNodes = await api.vfs.query(session, query, options);
        const dIds = dNodes.map((node) => node._id);

        log.profile("search.findByYear dIds");
        log.profile("search.findByYear aNodes");

        query = {
            "properties.type": "a",
            "properties.children.id": { $in: dIds }
        };

        const aNodes = await api.vfs.query(session, query);

        log.profile("search.findByYear aNodes");
        log.profile("search.findByYear lookup");

        for (const node of aNodes) {
            const paths = await api.vfs.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        log.profile("search.findByYear lookup");
        log.profile(`search.findByYear total ${year}`);

        return list;
    })
});

module.exports = search;
