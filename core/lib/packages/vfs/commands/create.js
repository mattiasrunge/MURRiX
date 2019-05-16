"use strict";

const Node = require("../../../core/Node");
const regenerate = require("./regenerate");

module.exports = async (client, abspath, type, name, attributes = {}) => {
    const parent = await Node.resolve(client, abspath);
    const node = await parent.createChild(client, type, name, attributes);

    return regenerate(client, node.path);
};
