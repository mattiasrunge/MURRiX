"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs-extra");
const Node = require("../../../core/Node");
const config = require("../../../configuration");
const media = require("../../../media");
const access = require("../../vfs/commands/access");
const syncmedia = require("./syncmedia");

module.exports = async (session, abspath, type) => {
    const node = await Node.resolve(session, abspath);

    assert(await access(session, node, "w"), "Permission denied");
    assert(node.properties.type === "f", "Only files can have cached media");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);
    const list = await media.getAllCached(node._id, filename, type);

    for (const filename of list) {
        try {
            await fs.remove(filename);
        } catch (error) {
        }
    }

    if (node.attributes.cached) {
        await syncmedia(session, node);
    }
};
