"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, abspath, name) => {
    const node = await Node.resolve(client, abspath);

    return node.getUniqueChildName(client, name);
};
