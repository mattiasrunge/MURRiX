"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Get only get children of persons");

    const children = await api.list(client, `${abspath}/children`);

    await Promise.all(children.map(async (child) => {
        child.age = await api.age(client, child.path);
    }));

    children.sort((a, b) => b.age.age - a.age.age);

    return children;
};
