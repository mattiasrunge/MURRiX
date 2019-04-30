"use strict";

const path = require("path");
const Node = require("../../../core/Node");

module.exports = async (session, abspath, type, attributes = {}) => {
    let node = await Node.exists(session, abspath);

    if (!(node)) {
        const parentPath = path.dirname(abspath);
        const name = path.basename(abspath);

        const parent = await Node.resolve(session, parentPath);

        node = await parent.createChild(session, type, name, attributes);
    }

    return node;
};
