"use strict";

const path = require("path");
const assert = require("assert");
const Node = require("../lib/Node");
const access = require("./access");
const config = require("../../lib/configuration");
const media = require("../../lib/media");

module.exports = async (session, abspath) => {
    let node = await Node.resolve(session, abspath);

    assert(await access(session, node, "w"), "Permission denied");
    assert(node.properties.type === "f", "Only files can have cached media");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);
    const cached = await media.getAllCached(node._id, filename, "*", { format: true });

    node = await Node.resolve(session, node.path); // Resolve again to make sure we do not have a stale copy and overwrite something
    await node.update(session, { cached }, true);
};