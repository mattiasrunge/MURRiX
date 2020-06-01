"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Translate node id to path
    opts,
    id // Generic
) => {
    const nodes = await api.lookup(client, id);

    for (const node of nodes) {
        term.writeln(node.path);
    }
};
