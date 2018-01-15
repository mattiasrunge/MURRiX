"use strict";

const assert = require("assert");
const Node = require("../lib/Node");
const { ADMIN_SESSION, isAdmin } = require("../lib/auth");

module.exports = async (session, username, oldPassword, newPassword) => {
    assert(username === session.username || isAdmin(session), "Permission denied");

    const user = await Node.resolve(ADMIN_SESSION, `/users/${username}`);

    if (!isAdmin(session)) {
        assert(user.matchPassword(oldPassword), "Authentication failed");
    }

    return user.setPassword(ADMIN_SESSION, newPassword);
};
