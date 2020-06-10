"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, gender, parentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    assert(gender === "f" || gender === "m", "Gender must be f or m");

    const parents = await api.list(client, `${abspath}/parents`);
    const parent = parents.find(({ attributes }) => attributes.gender === gender);

    if (parent) {
        await api.unlink(client, parent.extra.linkPath);
    }

    if (parentpath) {
        const s1 = await api.symlink(client, parentpath, `${abspath}/parents`);
        const s2 = await api.symlink(client, abspath, `${parentpath}/children`);

        await api.groupnodes(client, [ s1, s2 ]);

        return api.resolve(client, parentpath);
    }

    return null;
};
