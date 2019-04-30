"use strict";

const Node = require("../../../core/Node");

module.exports = async (session, type) => {
    const Type = Node.getType(type);

    return Type.getAttributeTypes();
};
