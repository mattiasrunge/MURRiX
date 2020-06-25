"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Translate node id to path
    opts, // f Try to fix incorrect reference count
    id // Generic
) => {
    const nodes = await api.lookup(client, id, {
        fix: !!opts.f
    });

    for (const node of nodes) {
        term.writeln(node.path);
    }
};
