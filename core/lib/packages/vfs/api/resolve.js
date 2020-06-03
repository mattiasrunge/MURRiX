"use strict";

const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, options = {}) => {
    try {
        if (abspath.includes("*") && options.list) {
            return await api.list(client, abspath, options);
        }

        const node = await Node.resolve(client, abspath, options);
        const snode = await node.serialize(client);

        return options.list ? [ snode ] : snode;
    } catch (error) {
        if (options.noerror) {
            return options.list ? [ ] : false;
        }

        throw error;
    }
};
