"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, abspath, level) => {
    try {
        const node = await Node.resolve(client, abspath);

        return node.hasAccess(client, level);
    } catch {}

    return false;
};
