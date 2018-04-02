"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, type, name, attributes = {}) => {
    const parent = await Node.resolve(session, abspath);
    const node = await parent.createChild(session, type, name, attributes);

    return node.serialize(session);
};
