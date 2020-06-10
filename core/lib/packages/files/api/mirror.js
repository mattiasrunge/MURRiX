"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Only files can be mirrored");
    assert(await api.access(client, node, "w"), "Permission denied");

    await node.update(client, { mirror: !node.attributes.mirror });

    await api.rmmedia(client, node, "image");
    await api.rmmedia(client, node, "video");
};
