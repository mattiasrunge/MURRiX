"use strict";

const path = require("path");
const fs = require("fs-extra");
const assert = require("assert");
const Node = require("../lib/Node");
const access = require("./access");
const config = require("../../lib/configuration");
const media = require("../../lib/media");
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