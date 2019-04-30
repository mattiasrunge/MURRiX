"use strict";

const Node = require("../../../core/Node");
const regenerate = require("./regenerate");

module.exports = async (session, abspath, type, name, attributes = {}) => {
    const parent = await Node.resolve(session, abspath);
    const node = await parent.createChild(session, type, name, attributes);

    return regenerate(session, node.path);
};
