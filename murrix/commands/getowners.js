"use strict";

const assert = require("assert");
const { Node } = require("../../vfs");
const list = require("../../vfs/commands/list");

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "c" || node.properties.type === "l", "Get only get owners of cameras or locations");

    return await list(session, `${abspath}/owners`);
};
