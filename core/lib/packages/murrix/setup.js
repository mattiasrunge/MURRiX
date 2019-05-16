"use strict";

const auth = require("../../core/auth");

const setup = async (client, api) => {
    // Create folders
    await api.ensure(client, "/albums", "d", { gid: auth.GID_USERS });
    await api.ensure(client, "/cameras", "d", { gid: auth.GID_USERS });
    await api.ensure(client, "/locations", "d", { gid: auth.GID_USERS });
    await api.ensure(client, "/people", "d", { gid: auth.GID_USERS });
    await api.ensure(client, "/news", "d", { gid: auth.GID_USERS });
};

module.exports = setup;
