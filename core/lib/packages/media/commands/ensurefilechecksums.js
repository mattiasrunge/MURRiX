"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../log")(module);
const metadata = require("../../vfs/commands/metadata");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only ensure faces for files");

    if (!node.attributes.sha1) {
        log.info(`No sha1 info found for ${node.path}, will calculate...`);

        const { sha1, md5 } = await metadata(client, node.path);

        await node.update(client, { sha1, md5 });

        return sha1;
    }

    return node.attributes.sha1;
};
