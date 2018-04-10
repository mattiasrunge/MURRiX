"use strict";

const assert = require("assert");
const { Node } = require("../../vfs");
const list = require("../../vfs/commands/list");

module.exports = async (session, abspath, gender) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "p", "Get only get parents of persons");

    const parents = await list(session, `${abspath}/parents`);

    return parents.find((parent) => parent.attributes.gender === gender) || null;
};
