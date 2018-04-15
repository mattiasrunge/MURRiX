"use strict";

const assert = require("assert");
const path = require("path");
const Node = require("../lib/Node");
const config = require("../../core/lib/configuration");
const media = require("../../core/lib/media");

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "f", "Can only get media for files");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    const cached = await media.getCached(node._id, filename, {
        angle: node.attributes.angle,
        mirror: node.attributes.mirror,
        width: 2000,
        type: "image"
    });

    return await media.detectFaces(cached);
};
