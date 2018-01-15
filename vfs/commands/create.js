"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, type, name, attributes = {}) => {
    const node = await Node.resolve(session, abspath);

    return node.createChild(session, type, name, attributes);
};
