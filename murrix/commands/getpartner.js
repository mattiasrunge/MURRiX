"use strict";

const assert = require("assert");
const { Node } = require("../../vfs");
const resolve = require("../../vfs/commands/resolve");

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "p", "Get only get partner of persons");

    const partner = await resolve(session, `${abspath}/partner`, { noerror: true });

    return partner || null;
};
