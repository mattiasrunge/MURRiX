"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, query, options) => {
    const nodes = await Node.query(client, query, options);

    return Promise.all(nodes.map((node) => node.serialize(client)));
};
