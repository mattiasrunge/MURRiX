"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../lib/auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const abspath = `/users/${client.getUsername()}/stars`;
    await api.ensure(ADMIN_CLIENT, abspath, "d");

    const list = await Node.list(ADMIN_CLIENT, abspath);

    return Promise.all(list.map((nodepath) => nodepath.serialize(client)));
};
