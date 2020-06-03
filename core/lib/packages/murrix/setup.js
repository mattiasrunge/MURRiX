"use strict";

const { GID_USERS } = require("../../auth");
const { api } = require("../../api");

const setup = async (client) => {
    // Create folders
    await api.ensure(client, "/albums", "d", { gid: GID_USERS });
    await api.ensure(client, "/cameras", "d", { gid: GID_USERS });
    await api.ensure(client, "/locations", "d", { gid: GID_USERS });
    await api.ensure(client, "/people", "d", { gid: GID_USERS });
    await api.ensure(client, "/news", "d", { gid: GID_USERS });
};

setup.PRIORITY = 4;

module.exports = setup;
