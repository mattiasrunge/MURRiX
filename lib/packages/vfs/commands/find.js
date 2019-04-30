"use strict";

const Node = require("../../../core/Node");

module.exports = async (session, abspath, search) => {
    const guard = [];
    const node = await Node.resolve(session, abspath);

    const children = await node.children(session);
    const matched = children.filter((child) => child.name.includes(search));

    for (const child of children) {
        if (guard.includes(child._id)) {
            continue;
        }

        guard.push(child._id);

        const list = await module.exports(session, child, search);
        matched.push(...list);
    }

    return matched;
};
