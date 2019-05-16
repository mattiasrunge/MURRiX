"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, type) => {
    const Type = Node.getType(type);

    return Type.getActionTypes();
};
