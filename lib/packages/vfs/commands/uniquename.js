"use strict";

const Node = require("../../../core/Node");

module.exports = async (session, abspath, name) => {
    const node = await Node.resolve(session, abspath);

    return node.getUniqueChildName(session, name);
};
