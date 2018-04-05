"use strict";

const Node = require("../lib/Node");

module.exports = async (session, type) => {
    const Type = Node.getType(type);

    return Type.getAttributeTypes();
};
