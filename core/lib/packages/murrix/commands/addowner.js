"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const symlink = require("../../vfs/commands/symlink");

module.exports = async (client, abspath, ownerpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "c", "Get only add owners of cameras");

    await symlink(client, ownerpath, `${abspath}/owners`);
};
