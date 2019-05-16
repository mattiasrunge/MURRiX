"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");
const unlink = require("./unlink");
const symlink = require("./symlink");

module.exports = async (client, abspath) => {
    assert(!client.isGuest(), "Permission denied");

    const starspath = `/users/${client.getUsername()}/stars`;
    const list = await Node.list(ADMIN_CLIENT, starspath, { nofollow: true });
    const star = list.find((node) => node.attributes.path === abspath);

    if (star) {
        await unlink(ADMIN_CLIENT, star.path);
    } else {
        await symlink(ADMIN_CLIENT, abspath, starspath);
    }
};
