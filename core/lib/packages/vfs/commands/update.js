"use strict";

const Node = require("../../../core/Node");
const regenerate = require("./regenerate");

module.exports = async (client, abspath, attributes) => {
    const node = await Node.resolve(client, abspath, { readlink: true });

    await node.update(client, attributes);

    return regenerate(client, node.path);
};
