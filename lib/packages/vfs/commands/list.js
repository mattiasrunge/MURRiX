"use strict";

const Node = require("../../../core/Node");
const url = require("../../media/commands/url");

module.exports = async (session, abspath, options = {}) => {
    try {
        let list;

        if (abspath instanceof Array) {
            const promises = abspath.map((abspath) => Node.list(session, abspath, options));
            const results = await Promise.all(promises);

            list = results.reduce((acc, val) => acc.concat(val), []);
        } else {
            list = await Node.list(session, abspath, options);
        }

        const serialized = await Promise.all(list.map((node) => node.serialize(session)));

        if (options.media) { // Make something more generic of this, no hard dep to media module
            return Promise.all(serialized.map(async (node) => ({
                ...node,
                url: await url(session, node.path, options.media) // TODO: Move to extra
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
