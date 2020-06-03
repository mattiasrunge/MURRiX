"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, type) => {
    const Type = Node.getType(type);

    return Type.getActionTypes();
};
