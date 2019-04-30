"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_SESSION, isGuest } = require("../../../core/auth");
const unlink = require("./unlink");
const symlink = require("./symlink");

module.exports = async (session, abspath) => {
    assert(!isGuest(session), "Permission denied");

    const starspath = `/users/${session.username}/stars`;
    const list = await Node.list(ADMIN_SESSION, starspath, { nofollow: true });
    const star = list.find((node) => node.attributes.path === abspath);

    if (star) {
        await unlink(ADMIN_SESSION, star.path);
    } else {
        await symlink(ADMIN_SESSION, abspath, starspath);
    }
};
