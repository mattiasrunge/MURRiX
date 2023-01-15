"use strict";

const assert = require("assert");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, groupname = false) => {
    assert(!client.isGuest(), "Permission denied");

    const dir = groupname ? `/groups/${groupname}/users` : "/users";

    return api.list(await getAdminClient(), dir);
};
