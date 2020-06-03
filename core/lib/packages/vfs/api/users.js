"use strict";

const assert = require("assert");
const { ADMIN_CLIENT } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, groupname = false) => {
    assert(!client.isGuest(), "Permission denied");

    const dir = groupname ? `/groups/${groupname}/users` : "/users";

    return api.list(ADMIN_CLIENT, dir);
};
