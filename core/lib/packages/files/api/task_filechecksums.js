"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const log = require("../../../lib/log")(module);
const { api } = require("../../../api");

module.exports = async (client, taskNode) => {
    assert(client.isAdmin(), "Permission denied");

    const query = {
        "properties.type": "f",
        "attributes.sha1": { $exists: false }
    };

    const count = await Node.count(client, query);

    await api.update(client, taskNode.path, { nodesLeft: count });

    if (count > 0) {
        log.info(`Task ensure checksums found ${count} nodes that needs to be processed`);

        const list = await Node.query(client, query, {
            limit: 3,
            sort: { "properties.birthtime": -1 }
        });

        for (const node of list) {
            if (!node.path) {
                log.info(`Node with id ${node._id} seems to not be present in the tree, it has no path...`);

                continue;
            }

            await api.ensurefilechecksums(client, node);

            return true;
        }
    }

    return false;
};
