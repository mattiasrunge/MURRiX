"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const resolve = require("../../vfs/commands/resolve");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Path is not a user");

    const person = await resolve(client, `${abspath}/person`, { noerror: true });

    return person || null;
};
