"use strict";

const assert = require("assert");
const { ADMIN_SESSION, isGuest } = require("../lib/auth");
const list = require("./list");

module.exports = async (session, groupname = false) => {
    assert(!isGuest(session), "Permission denied");

    const dir = groupname ? `/groups/${groupname}/users` : "/users";

    return list(ADMIN_SESSION, dir);
};
