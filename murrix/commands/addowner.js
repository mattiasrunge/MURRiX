"use strict";

const assert = require("assert");
const { Node } = require("../../vfs");
const symlink = require("../../vfs/commands/symlink");

module.exports = async (session, abspath, ownerpath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "c" || node.properties.type === "l", "Get only set owners of cameras or locations");

    await symlink(session, ownerpath, `${abspath}/owners`);
};
