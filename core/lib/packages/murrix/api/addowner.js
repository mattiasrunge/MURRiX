"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, ownerpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "c", "Get only add owners of cameras");

    await api.symlink(client, ownerpath, `${abspath}/owners`);
};
