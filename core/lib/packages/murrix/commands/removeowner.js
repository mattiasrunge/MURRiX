"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const unlink = require("../../vfs/commands/unlink");
const list = require("../../vfs/commands/list");

module.exports = async (client, abspath, ownerpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "c", "Get only remove owners of cameras");

    const owners = await list(client, `${abspath}/owners`, { nofollow: true });
    const owner = owners.find((owner) => owner.attributes.path === ownerpath);

    assert(owner, "No such owner found");

    await unlink(client, owner.path);
};
