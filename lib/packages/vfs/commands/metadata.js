"use strict";

const path = require("path");
const Node = require("../../../core/Node");
const config = require("../../../configuration");
const media = require("../../../media");

module.exports = async (session, abspath, options = {}) => {
    const node = await Node.resolve(session, abspath);

    if (node.properties.type !== "f") {
        throw new Error("Metadata must be run on a file");
    }

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    return await media.getMetadata(filename, options);
};
