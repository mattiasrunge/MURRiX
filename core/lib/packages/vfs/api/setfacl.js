"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, abspath, ac, options = {}) => {
    const node = await Node.resolve(client, abspath);

    await node.setfacl(client, ac, options);
};
