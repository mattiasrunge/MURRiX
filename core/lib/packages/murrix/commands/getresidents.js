"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const list = require("../../vfs/commands/list");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "l", "Get only get residents of locations");

    return await list(client, `${abspath}/residents`);
};
