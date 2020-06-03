"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, residentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "l", "Get only remove residents of locations");

    const residents = await api.list(client, `${abspath}/residents`, { nofollow: true });
    const resident = residents.find((resident) => resident.attributes.path === residentpath);

    assert(resident, "No such resident found");

    await api.unlink(client, resident.path);
};
