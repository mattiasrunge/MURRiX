"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const abspath = `/users/${client.getUsername()}/stars`;
    const list = await Node.list(ADMIN_CLIENT, abspath);

    return Promise.all(list.map((nodepath) => nodepath.serialize(client)));
};
