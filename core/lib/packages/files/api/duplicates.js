"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Metadata must be run on a file");

    if (!node.attributes.sha1) {
        return [];
    }

    const nodes = await Node.query(client, {
        "attributes.sha1": node.attributes.sha1
    });

    return nodes.map(({ path }) => path).filter((p) => p !== node.path);
};
