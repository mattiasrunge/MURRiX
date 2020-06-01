"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, id) => {
    const node = await Node.resolve(client, id);

    assert(!node.path, `Node ${node._id} is not lost!`);

    await api.link(client, node, `/lost+found/${node._id}`);

    return api.resolve(client, node._id);
};
