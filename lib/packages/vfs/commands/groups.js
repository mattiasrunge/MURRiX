"use strict";

const assert = require("assert");
const { ADMIN_SESSION, isGuest } = require("../../../core/auth");
const list = require("./list");

module.exports = async (session, username = false) => {
    assert(!isGuest(session), "Permission denied");

    const dir = username ? `/users/${username}/groups` : "/groups";

    return list(ADMIN_SESSION, dir);
};
