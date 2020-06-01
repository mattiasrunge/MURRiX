"use strict";

const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, attributes) => {
    const node = await Node.resolve(client, abspath, { readlink: true });

    await node.update(client, attributes);

    return api.regenerate(client, node.path);
};
