"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Print node properties
    opts, // l Don't follow links
    abspath = "" // AbsolutePath
) => {
    const node = await api.resolve(client, abspath, {
        nofollow: opts.l
    });

    term.writeJson(node.properties);
};
