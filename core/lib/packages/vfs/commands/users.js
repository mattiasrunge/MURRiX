"use strict";

const assert = require("assert");
const { ADMIN_CLIENT } = require("../../../core/auth");
const list = require("./list");

module.exports = async (client, groupname = false) => {
    assert(!client.isGuest(), "Permission denied");

    const dir = groupname ? `/groups/${groupname}/users` : "/users";

    return list(ADMIN_CLIENT, dir);
};
