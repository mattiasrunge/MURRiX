"use strict";

const path = require("path");
const escapeStringRegexp = require("escape-string-regexp");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

const parsePattern = (abspath) => {
    const basename = path.basename(abspath);

    if (basename.includes("*")) {
        return {
            pattern: escapeStringRegexp(basename).replace(/\\\*/g, ".*"),
            abspath: path.dirname(abspath)
        };
    }

    return {
        pattern: null,
        abspath
    };
};

module.exports = async (client, abspath, options = {}) => {
    try {
        const paths = Array.isArray(abspath) ? abspath : [ abspath ];
        const promises = paths
        .map(parsePattern)
        .map(({ pattern, abspath }) => Node.list(client, abspath, {
            pattern,
            ...options
        }));
        const results = await Promise.all(promises);
        const list = results.flat();
        const serialized = await Promise.all(list.map((node) => node.serialize(client)));

        if (options.media) { // Make something more generic of this, no hard dep to media module
            return Promise.all(serialized.map(async (node) => ({
                ...node,
                url: await api.url(client, node.path, options.media) // TODO: Move to extra
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
