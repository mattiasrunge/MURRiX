"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, abspath, options = {}) => {
    const node = await Node.resolve(client, abspath, options);

    return await node.revisions(client);
};
