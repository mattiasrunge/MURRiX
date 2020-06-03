"use strict";

const escapeStringRegexp = require("escape-string-regexp");
const Node = require("../../../lib/Node");

module.exports = async (client, abspath, search) => {
    const guard = [];
    const node = await Node.resolve(client, abspath);
    const pattern = escapeStringRegexp(search).replace(/\\\*/g, ".*");
    const expr = new RegExp(`^${pattern}$`, "i");

    const children = await node.children(client);
    const matched = children.filter(({ name }) => expr.test(name));

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
