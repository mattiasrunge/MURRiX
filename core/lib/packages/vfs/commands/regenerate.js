
"use strict";

const color = require("../../../lib/color");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Regenerate node
    opts, // o Overwrite existing metadata
    abspath = "" // AbsolutePath
) => {
    const nodes = await api.resolve(client, abspath, {
        list: true,
        noerror: true
    });

    for (const node of nodes) {
        term.writeln(`Regenerating ${color.bold(node.name)}...`);
        await api.regenerate(client, node.path, {
            overwrite: opts.o
        });
    }
};
