"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../log")(module);
const migrateoldtags = require("./migrateoldtags");
const ensurefilefaces = require("./ensurefilefaces");
const found = require("../../vfs/commands/found");

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
        let node = list[0];

        if (!node.path) {
            log.info(`Node with id ${node._id} seems to not be present in the tree, it has no path, will run found on it`);

            node = await found(client, node);
        }

        await migrateoldtags(client, node.path);
        await ensurefilefaces(client, node.path);

        return true;
    }

    return false;
};
