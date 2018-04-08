"use strict";

const assert = require("assert");
const Node = require("../lib/Node");
const access = require("./access");
const rmmedia = require("./rmmedia");

module.exports = async (session, abspath, offset) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "f", "Only files can be rotated");
    assert(await access(session, node, "w"), "Permission denied");

    offset = parseInt(offset, 10);

    if (node.attributes.mirror) {
        offset = -offset;
    }

    let angle = parseInt(node.attributes.angle || 0, 10) + offset;

    angle = angle % 360;
    angle = angle < 0 ? angle + 360 : angle;

    await node.update(session, { angle });

    await rmmedia(session, node, "image");
    await rmmedia(session, node, "video");
};
