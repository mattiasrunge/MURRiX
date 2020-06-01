"use strict";

const { api } = require("../../../api");

module.exports = async (client, term
// List all albums that have not files or texts
) => {
    const albums = await api.list(client, "/albums", { nofollow: true });
    const matched = [];

    for (const node of albums) {
        const fnode = await api.resolve(client, `${node.path}/files`, { nofollow: true, noerror: true });
        const tnode = await api.resolve(client, `${node.path}/texts`, { nofollow: true, noerror: true });

        if (fnode.properties.children.length === 0 && tnode.properties.children.length === 0) {
            matched.push(node);
        }
    }

    for (const node of matched) {
        term.writeln(node.path);
    }
};
