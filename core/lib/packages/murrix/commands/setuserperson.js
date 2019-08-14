"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const symlink = require("../../vfs/commands/symlink");
const removeuserperson = require("./removeuserperson");

module.exports = async (client, abspath, personpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Get only set a person on a user");

    await removeuserperson(client, abspath);
    await symlink(client, personpath, `${abspath}/person`);
};
