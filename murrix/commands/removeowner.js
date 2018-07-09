"use strict";

const assert = require("assert");
const { Node } = require("../../vfs");
const unlink = require("../../vfs/commands/unlink");
const list = require("../../vfs/commands/list");

module.exports = async (session, abspath, ownerpath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "c", "Get only remove owners of cameras");

    const owners = await list(session, `${abspath}/owners`, { nofollow: true });
    const owner = owners.find((owner) => owner.attributes.path === ownerpath);

    assert(owner, "No such owner found");

    await unlink(session, owner.path);
};
