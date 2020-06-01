"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../lib/auth");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    assert(!client.isGuest(), "Permission denied");

    const starspath = `/users/${client.getUsername()}/stars`;
    await api.ensure(ADMIN_CLIENT, starspath, "d");

    const list = await Node.list(ADMIN_CLIENT, starspath, { nofollow: true });
    const star = list.find((node) => node.attributes.path === abspath);

    if (star) {
        await api.unlink(ADMIN_CLIENT, star.path);
    } else {
        await api.symlink(ADMIN_CLIENT, abspath, starspath);
    }
};
