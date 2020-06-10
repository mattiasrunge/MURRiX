"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Path is not a user");

    const person = await api.resolve(client, `${abspath}/person`, { noerror: true });

    return person || null;
};
