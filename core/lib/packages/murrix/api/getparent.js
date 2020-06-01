"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, gender) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    assert(gender === "f" || gender === "m", "Gender must be f or m");

    const parents = await api.list(client, `${abspath}/parents`);

    return parents.find((parent) => parent.attributes.gender === gender) || null;
};
