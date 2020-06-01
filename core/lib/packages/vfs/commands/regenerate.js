
"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Regenerate node
    opts,
    abspath = "" // AbsolutePath
) => {
    const nodes = await api.resolve(client, abspath, {
        list: true,
        noerror: true
    });

    for (const node of nodes) {
        term.writeln(`Regenerating ${chalk.bold(node.name)}...`);
        await api.regenerate(client, node.path);
    }
};
