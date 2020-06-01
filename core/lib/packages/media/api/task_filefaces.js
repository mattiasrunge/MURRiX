"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../lib/log")(module);
const { api } = require("../../../api");

module.exports = async (client, taskNode) => {
    assert(client.isAdmin(), "Permission denied");

    const query = {
        "properties.type": "f",
        "attributes.type": { $in: [ "image" ] },
        "attributes.faces": { $exists: false }
    };

    const count = await Node.count(client, query);

    await api.update(client, taskNode.path, { nodesLeft: count });

    if (count > 0) {
        log.info(`Task ensure faces found ${count} nodes that needs to be processed`);

        const list = await Node.query(client, query, {
            limit: 1,
            sort: { "properties.birthtime": -1 }
        });

        if (list[0]) {
            let node = list[0];

            if (!node.path) {
                log.info(`Node with id ${node._id} seems to not be present in the tree, it has no path, will run found on it`);

                node = await api.found(client, node);
            }

            await api.migrateoldtags(client, node.path);
            await api.ensurefilefaces(client, node.path);

            return true;
        }
    }

    return false;
};
