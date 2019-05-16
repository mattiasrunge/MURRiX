"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, abspath, options = {}) => {
    try {
        const node = await Node.resolve(client, abspath, options);

        return node.serialize(client);
    } catch (error) {
        if (options.noerror) {
            return false;
        }

        throw error;
    }
};
