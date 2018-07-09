"use strict";

const assert = require("assert");
const { Node } = require("../../vfs");
const symlink = require("../../vfs/commands/symlink");

module.exports = async (session, abspath, residentpath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "l", "Get only add residents of locations");

    await symlink(session, residentpath, `${abspath}/residents`);
};
