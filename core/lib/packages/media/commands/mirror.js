"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const access = require("../../vfs/commands/access");
const rmmedia = require("./rmmedia");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Only files can be mirrored");
    assert(await access(client, node, "w"), "Permission denied");

    await node.update(client, { mirror: !node.attributes.mirror });

    await rmmedia(client, node, "image");
    await rmmedia(client, node, "video");
};
