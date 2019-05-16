"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const list = require("../../vfs/commands/list");

module.exports = async (client, abspath, gender) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    assert(gender === "f" || gender === "m", "Gender must be f or m");

    const parents = await list(client, `${abspath}/parents`);

    return parents.find((parent) => parent.attributes.gender === gender) || null;
};
