"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Get a random node that has label
    opts,
    label // Generic
) => {
    const node = await api.randombylabel(client, label, [ "a", "p", "l", "c" ]);

    term.writeln(node.path);
};
