"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, abspath, search) => {
    const guard = [];
    const node = await Node.resolve(client, abspath);

    const children = await node.children(client);
    const matched = children.filter((child) => child.name.includes(search));

    for (const child of children) {
        if (guard.includes(child._id)) {
            continue;
        }

        guard.push(child._id);

        const list = await module.exports(client, child, search);
        matched.push(...list);
    }

    return matched;
};
