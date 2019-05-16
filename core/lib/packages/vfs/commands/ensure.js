"use strict";

const path = require("path");
const Node = require("../../../core/Node");

module.exports = async (client, abspath, type, attributes = {}) => {
    let node = await Node.exists(client, abspath);

    if (!(node)) {
        const parentPath = path.dirname(abspath);
        const name = path.basename(abspath);

        const parent = await Node.resolve(client, parentPath);

        node = await parent.createChild(client, type, name, attributes);
    }

    return node;
};
