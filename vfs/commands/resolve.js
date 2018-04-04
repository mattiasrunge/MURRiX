"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, options = {}) => {
    try {
        const node = await Node.resolve(session, abspath, options);

        return node.serialize(session);
    } catch (error) {
        if (options.noerror) {
            return false;
        }

        throw error;
    }
};
