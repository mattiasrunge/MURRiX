"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const unlink = require("../../vfs/commands/unlink");
const exists = require("../../vfs/commands/exists");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Get only remove a person on a user");

    if (await exists(client, `${abspath}/person`)) {
        await unlink(client, `${abspath}/person`);
    }
};
