"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const symlink = require("../../vfs/commands/symlink");

module.exports = async (session, abspath, ownerpath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "c", "Get only add owners of cameras");

    await symlink(session, ownerpath, `${abspath}/owners`);
};
