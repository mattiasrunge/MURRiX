"use strict";

const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, type, name, attributes = {}) => {
    const parent = await Node.resolve(client, abspath);
    const node = await parent.createChild(client, type, name, attributes);

    return api.regenerate(client, node.path);
};
