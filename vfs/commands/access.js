"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, level) => {
    try {
        const nodepath = await Node.resolve(session, abspath);

        return nodepath.hasAccess(session, level);
    } catch (error) {
    }

    return false;
};
