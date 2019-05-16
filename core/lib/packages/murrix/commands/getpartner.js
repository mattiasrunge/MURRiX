"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const resolve = require("../../vfs/commands/resolve");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");

    const partner = await resolve(client, `${abspath}/partner`, { noerror: true });

    return partner || null;
};
