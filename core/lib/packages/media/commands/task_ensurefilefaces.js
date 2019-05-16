"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const migrateoldtags = require("./migrateoldtags");
const ensurefilefaces = require("./ensurefilefaces");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const list = await Node.query(client, {
        "properties.type": "f",
        "attributes.type": { $in: [ "image" ] },
        "attributes.faces": { $exists: false }
    }, {
        limit: 1,
        sort: { "properties.birthtime": -1 }
    });

    if (list[0]) {
        await migrateoldtags(client, list[0].path);
        await ensurefilefaces(client, list[0].path);

        return true;
    }

    return false;
};
