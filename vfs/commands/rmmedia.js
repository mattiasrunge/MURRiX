"use strict";

const path = require("path");
const fs = require("fs-extra");
const assert = require("assert");
const Node = require("../lib/Node");
const access = require("./access");
const config = require("../../core/lib/configuration");
const media = require("../../core/lib/media");

module.exports = async (session, abspath, type) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "f", "Only files can be rotated");
    assert(await access(session, node, "w"), "Permission denied");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    const list = await media.getAllCached(node._id, filename, type);

    for (const filename of list) {
        await fs.remove(filename);
    }
};
