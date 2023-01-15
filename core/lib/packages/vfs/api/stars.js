"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const abspath = `/users/${client.getUsername()}/stars`;
    await api.ensure(await getAdminClient(), abspath, "d");

    const list = await Node.list(await getAdminClient(), abspath);

    return Promise.all(list.map((nodepath) => nodepath.serialize(client)));
};
