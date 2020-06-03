"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, ownerpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "c", "Get only remove owners of cameras");

    const owners = await api.list(client, `${abspath}/owners`, { nofollow: true });
    const owner = owners.find((owner) => owner.attributes.path === ownerpath);

    assert(owner, "No such owner found");

    await api.unlink(client, owner.path);
};
