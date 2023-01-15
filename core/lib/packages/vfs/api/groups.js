"use strict";

const assert = require("assert");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, username = false) => {
    assert(!client.isGuest(), "Permission denied");

    const dir = username ? `/users/${username}/groups` : "/groups";

    return api.list(await getAdminClient(), dir);
};
