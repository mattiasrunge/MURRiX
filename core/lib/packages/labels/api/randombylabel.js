"use strict";

const path = require("path");
const { api } = require("../../../api");

module.exports = async (client, label, types, excludePaths = []) => {
    const nodes = await api.list(path.join("/labels", label, "*"), {
        noerror: true
    });
    const list = nodes
    .filter((node) => !excludePaths.includes(node.path))
    .filter((node) => types.includes(node.properties.type));

    while (list.length > 0) {
        const index = Math.floor(Math.random() * list.length);
        const node = list.splice(index, 1)[0];

        if (await node.hasAccess(client, "r")) {
            return node.serialize(client);
        }
    }

    throw new Error("Could not find a readable random node based on label");
};
