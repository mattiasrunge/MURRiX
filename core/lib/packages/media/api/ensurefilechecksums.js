"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../lib/log")(module);
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    let node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only ensure faces for files");

    if (!node.attributes.sha1) {
        if (!node.path) {
            log.info(`Node with id ${node._id} seems to not be present in the tree, it has no path, will run found on it`);

            node = await api.found(client, node);
        }

        const { sha1, md5 } = await api.metadata(client, node.path);

        await node.update(client, { sha1, md5 });

        return sha1;
    }

    return node.attributes.sha1;
};
