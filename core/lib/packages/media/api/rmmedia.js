"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs-extra");
const Node = require("../../../lib/Node");
const config = require("../../../config");
const media = require("../../../media");
const { api } = require("../../../api");

module.exports = async (client, abspath, type) => {
    const node = await Node.resolve(client, abspath);

    assert(await api.access(client, node, "w"), "Permission denied");
    assert(node.properties.type === "f", "Only files can have cached media");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);
    const list = await media.getAllCached(node._id, filename, type);

    for (const filename of list) {
        try {
            await fs.remove(filename);
        } catch {}
    }

    if (node.attributes.cached) {
        await api.syncmedia(client, node);
    }
};
