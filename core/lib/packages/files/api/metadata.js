"use strict";

const assert = require("assert");
const path = require("path");
const Node = require("../../../lib/Node");
const config = require("../../../config");
const media = require("../../../media");

module.exports = async (client, abspath, options = {}) => {
    const node = await Node.resolve(client, abspath);

    assert (node.properties.type === "f", "Metadata must be run on a file");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    return await media.getMetadata(filename, options);
};
