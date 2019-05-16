"use strict";

const assert = require("assert");
const { ADMIN_CLIENT } = require("../../../core/auth");
const list = require("./list");

module.exports = async (client, username = false) => {
    assert(!client.isGuest(), "Permission denied");

    const dir = username ? `/users/${username}/groups` : "/groups";

    return list(ADMIN_CLIENT, dir);
};
