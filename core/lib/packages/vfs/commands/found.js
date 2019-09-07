"use strict";

const path = require("path");
const Node = require("../../../core/Node");
const link = require("./link");
const resolve = require("./resolve");

module.exports = async (client, id) => {
    const node = await Node.resolve(client, id);

    // TODO: Assert that we have a stray

    await link(client, node, `/lost+found/${node._id}`);

    return resolve(client, node._id);
};
