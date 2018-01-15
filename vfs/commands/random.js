"use strict";

const path = require("path");
const Node = require("../lib/Node");

module.exports = async (session, abspaths, excludePaths = []) => {
    const list = [];

    for (const abspath of abspaths) {
        let parent;

        try {
            parent = await Node.resolve(session, abspath);
        } catch (error) {
            continue;
        }

        const children = parent.properties.children
        .map((child) => ({
            id: child.id,
            name: child.name,
            path: path.join(abspath, child.name)
        }))
        .filter((child) => !excludePaths.includes(child.path));

        list.push(...children);
    }

    while (list.length > 0) {
        const index = Math.floor(Math.random() * list.length);
        const child = list.splice(index, 1)[0];
        const node = await Node._instantiate(session, child.id, child.path, child.name);

        if (await node.hasAccess(session, "r")) {
            return node.serialize(session);
        }
    }

    throw new Error("Could not find a readable random node");
};
