"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");
const ensure = require("./ensure");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const abspath = `/users/${client.getUsername()}/stars`;
    await ensure(ADMIN_CLIENT, abspath, "d");

    const list = await Node.list(ADMIN_CLIENT, abspath);

    return Promise.all(list.map((nodepath) => nodepath.serialize(client)));
};
