"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT, GID_ADMIN, UID_ADMIN, GID_USERS } = require("../../../core/auth");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const root = await Node.resolve(ADMIN_CLIENT, "/");
    await root.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
    await root.chmod(ADMIN_CLIENT, 0o775);

    const albums = await Node.resolve(ADMIN_CLIENT, "/albums");
    await albums.chown(ADMIN_CLIENT, UID_ADMIN, GID_USERS);
    await albums.chmod(ADMIN_CLIENT, 0o770);

    const cameras = await Node.resolve(ADMIN_CLIENT, "/cameras");
    await cameras.chown(ADMIN_CLIENT, UID_ADMIN, GID_USERS);
    await cameras.chmod(ADMIN_CLIENT, 0o770);

    const locations = await Node.resolve(ADMIN_CLIENT, "/locations");
    await locations.chown(ADMIN_CLIENT, UID_ADMIN, GID_USERS);
    await locations.chmod(ADMIN_CLIENT, 0o770);

    const people = await Node.resolve(ADMIN_CLIENT, "/people");
    await people.chown(ADMIN_CLIENT, UID_ADMIN, GID_USERS);
    await people.chmod(ADMIN_CLIENT, 0o770);

    const groups = await Node.resolve(ADMIN_CLIENT, "/groups");
    await groups.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
    await groups.chmod(ADMIN_CLIENT, 0o770);

    const users = await Node.resolve(ADMIN_CLIENT, "/users");
    await users.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
    await users.chmod(ADMIN_CLIENT, 0o771);
};
