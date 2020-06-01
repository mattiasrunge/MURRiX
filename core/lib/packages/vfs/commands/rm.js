
"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Remove node or nodes
    opts, // f Remove without confirmation
    abspath // AbsolutePath
) => {
    const nodes = await api.resolve(client, abspath, {
        list: true,
        noerror: true
    });

    if (opts.f) {
        for (const node of nodes) {
            await api.unlink(client, node.path);
        }

        return;
    }

    for (const node of nodes) {
        const answer = await term.ask(`Are you sure you want to remove ${chalk.bold(node.name)}? [y/N]`);

        if (answer.toLowerCase() === "y") {
            await api.unlink(client, node.path);
        }
    }
};
