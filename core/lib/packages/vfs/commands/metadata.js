"use strict";

const path = require("path");
const Node = require("../../../core/Node");
const config = require("../../../configuration");
const media = require("../../../media");

module.exports = async (client, abspath, options = {}) => {
    const node = await Node.resolve(client, abspath);

    if (node.properties.type !== "f") {
        throw new Error("Metadata must be run on a file");
    }

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    return await media.getMetadata(filename, options);
};
