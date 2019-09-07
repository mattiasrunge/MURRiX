"use strict";

const assert = require("assert");
const path = require("path");
const Node = require("../../../core/Node");
const link = require("./link");
const resolve = require("./resolve");

module.exports = async (client, id) => {
    const node = await Node.resolve(client, id);

    assert(!node.path, `Node ${node._id} is not lost!`);

    await link(client, node, `/lost+found/${node._id}`);

    return resolve(client, node._id);
};
