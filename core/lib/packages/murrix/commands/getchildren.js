"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const list = require("../../vfs/commands/list");
const age = require("./age");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Get only get children of persons");

    const children = await list(client, `${abspath}/children`);

    await Promise.all(children.map(async (child) => {
        child.age = await age(client, child.path);
    }));

    children.sort((a, b) => b.age.age - a.age.age);

    return children;
};
