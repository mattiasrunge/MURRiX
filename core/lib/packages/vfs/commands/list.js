"use strict";

const Node = require("../../../core/Node");
const url = require("../../media/commands/url");

module.exports = async (client, abspath, options = {}) => {
    try {
        let list;

        if (Array.isArray(abspath)) {
            const promises = abspath.map((abspath) => Node.list(client, abspath, options));
            const results = await Promise.all(promises);

            list = results.reduce((acc, val) => acc.concat(val), []);
        } else {
            list = await Node.list(client, abspath, options);
        }

        const serialized = await Promise.all(list.map((node) => node.serialize(client)));

        if (options.media) { // Make something more generic of this, no hard dep to media module
            return Promise.all(serialized.map(async (node) => ({
                ...node,
                url: await url(client, node.path, options.media) // TODO: Move to extra
            })));
        }

        return serialized;
    } catch (error) {
        if (options.noerror) {
            return [];
        }

        throw error;
    }
};
