"use strict";

const assert = require("assert");
const Node = require("../lib/Node");
const { ADMIN_SESSION, isAdmin } = require("../lib/auth");

module.exports = async (session, username, active) => {
    assert(isAdmin(session), "Permission denied");

    const user = await Node.resolve(ADMIN_SESSION, `/users/${username}`);

    return user.setActivation(ADMIN_SESSION, active);
};
