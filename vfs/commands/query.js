"use strict";

const db = require("../../core/lib/db");
const Node = require("../lib/Node");

module.exports = async (session, query, options) => {
    if (options && options.fields) {
        options.fields.properties = 1;
    }

    const nodes = await db.find("nodes", query, { fields: [ "_id" ] });
    const results = [];

    for (const node of nodes) {
        const list = await Node.lookup(session, node._id);

        results.push(...list);
    }

    return Promise.all(results.map((node) => node.serialize(session)));
};
