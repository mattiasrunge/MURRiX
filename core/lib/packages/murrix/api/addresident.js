"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, residentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "l", "Get only add residents of locations");

    await api.symlink(client, residentpath, `${abspath}/residents`);
};
