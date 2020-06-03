"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "l", "Get only get residents of locations");

    return await api.list(client, `${abspath}/residents`);
};
