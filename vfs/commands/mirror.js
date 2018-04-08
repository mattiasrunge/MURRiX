"use strict";

const assert = require("assert");
const Node = require("../lib/Node");
const access = require("./access");
const rmmedia = require("./rmmedia");

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "f", "Only files can be mirrored");
    assert(await access(session, node, "w"), "Permission denied");

    await node.update(session, { mirror: !node.attributes.mirror });

    await rmmedia(session, node, "image");
    await rmmedia(session, node, "video");
};
