import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

const getAscendants = async (client, node) => {
    node.extra.parents = [];

    try {
        const mother = await api.getparent(client, node.path, "f");

        mother && node.extra.parents.push(mother);
    } catch {}

    try {
        const father = await api.getparent(client, node.path, "m");

        father && node.extra.parents.push(father);
    } catch {}

    await Promise.all(node.extra.parents.map((parent) => getAscendants(client, parent)));
};

const getDescendants = async (client, node) => {
    node.extra.children = await api.getchildren(client, node.path);

    await Promise.all(node.extra.children.map((child) => getDescendants(client, child)));
};

export default async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");

    await Promise.all([
        getAscendants(client, node),
        getDescendants(client, node)
    ]);

    return node;
};
