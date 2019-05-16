"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const access = require("../../vfs/commands/access");
const rmmedia = require("./rmmedia");

module.exports = async (client, abspath, offset) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Only files can be rotated");
    assert(await access(client, node, "w"), "Permission denied");

    offset = parseInt(offset, 10);

    if (node.attributes.mirror) {
        offset = -offset;
    }

    let angle = parseInt(node.attributes.angle || 0, 10) + offset;

    angle = angle % 360;
    angle = angle < 0 ? angle + 360 : angle;

    await node.update(client, { angle });

    await rmmedia(client, node, "image");
    await rmmedia(client, node, "video");
};
