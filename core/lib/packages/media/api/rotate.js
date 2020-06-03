"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, offset) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Only files can be rotated");
    assert(await api.access(client, node, "w"), "Permission denied");

    offset = Number.parseInt(offset, 10);

    if (node.attributes.mirror) {
        offset = -offset;
    }

    let angle = Number.parseInt(node.attributes.angle || 0, 10) + offset;

    angle = angle % 360;
    angle = angle < 0 ? angle + 360 : angle;

    await node.update(client, { angle });

    await api.rmmedia(client, node, "image");
    await api.rmmedia(client, node, "video");
};
