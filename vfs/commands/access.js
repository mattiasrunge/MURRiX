"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, level) => {
    try {
        const node = await Node.resolve(session, abspath);

        return node.hasAccess(session, level);
    } catch {
    }

    return false;
};
