"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const ensurefilechecksums = require("./ensurefilechecksums");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const list = await Node.query(client, {
        "properties.type": "f",
        "attributes.sha1": { $exists: false }
    }, {
        limit: 1,
        sort: { "properties.birthtime": -1 }
    });

    if (list[0]) {
        await ensurefilechecksums(client, list[0].path);

        return true;
    }

    return false;
};
