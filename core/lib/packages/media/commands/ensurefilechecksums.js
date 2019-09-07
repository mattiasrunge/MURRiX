"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../log")(module);
const metadata = require("../../vfs/commands/metadata");
const found = require("../../vfs/commands/found");

module.exports = async (client, abspath) => {
    let node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only ensure faces for files");

    if (!node.attributes.sha1) {
        log.info(`No sha1 info found for ${node.path} with id ${node._id}, will calculate...`);

        if (!node.path) {
            log.info(`Node with id ${node._id} seems to not be present in the tree, it has no path, will run found on it`);

            node = await found(client, node);
        }

        const { sha1, md5 } = await metadata(client, node.path);

        await node.update(client, { sha1, md5 });

        return sha1;
    }

    return node.attributes.sha1;
};
