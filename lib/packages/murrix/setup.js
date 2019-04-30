"use strict";

const auth = require("../../core/auth");

const setup = async (session, api) => {
    // Create folders
    await api.ensure(session, "/albums", "d", { gid: auth.GID_USERS });
    await api.ensure(session, "/cameras", "d", { gid: auth.GID_USERS });
    await api.ensure(session, "/locations", "d", { gid: auth.GID_USERS });
    await api.ensure(session, "/people", "d", { gid: auth.GID_USERS });
    await api.ensure(session, "/news", "d", { gid: auth.GID_USERS });
};

module.exports = setup;
