"use strict";

const Node = require("../../../core/Node");

module.exports = async (session, query, options) => {
    const nodes = await Node.query(session, query, options);

    return Promise.all(nodes.map((node) => node.serialize(session)));
};
