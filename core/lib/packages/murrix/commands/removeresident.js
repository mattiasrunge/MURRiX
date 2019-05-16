"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const unlink = require("../../vfs/commands/unlink");
const list = require("../../vfs/commands/list");

module.exports = async (client, abspath, residentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "l", "Get only remove residents of locations");

    const residents = await list(client, `${abspath}/residents`, { nofollow: true });
    const resident = residents.find((resident) => resident.attributes.path === residentpath);

    assert(resident, "No such resident found");

    await unlink(client, resident.path);
};
