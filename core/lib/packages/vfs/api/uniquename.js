"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, abspath, name) => {
    const node = await Node.resolve(client, abspath);

    return node.getUniqueChildName(client, name);
};
