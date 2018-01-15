"use strict";

const log = require("../../core/lib/log")(module);
const Node = require("../lib/Node");

module.exports = async (session, abspath, options = {}) => {
    try {
        const node = await Node.resolve(session, abspath, options);

        return node.serialize(session);
    } catch (error) {
        console.error(error);
        log.error(error);

        if (options.noerror) {
            return false;
        }

        throw error;
    }
};
