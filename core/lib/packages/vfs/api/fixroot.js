"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient, GID_ADMIN, UID_ADMIN, GID_USERS } = require("../../../auth");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const root = await Node.resolve(await getAdminClient(), "/");
    await root.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
    await root.chmod(await getAdminClient(), 0o775);

    const albums = await Node.resolve(await getAdminClient(), "/albums");
    await albums.chown(await getAdminClient(), UID_ADMIN, GID_USERS);
    await albums.chmod(await getAdminClient(), 0o770);

    const cameras = await Node.resolve(await getAdminClient(), "/cameras");
    await cameras.chown(await getAdminClient(), UID_ADMIN, GID_USERS);
    await cameras.chmod(await getAdminClient(), 0o770);

    const locations = await Node.resolve(await getAdminClient(), "/locations");
    await locations.chown(await getAdminClient(), UID_ADMIN, GID_USERS);
    await locations.chmod(await getAdminClient(), 0o770);

    const people = await Node.resolve(await getAdminClient(), "/people");
    await people.chown(await getAdminClient(), UID_ADMIN, GID_USERS);
    await people.chmod(await getAdminClient(), 0o770);

    const lostfound = await Node.resolve(await getAdminClient(), "/lost+found");
    await lostfound.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
    await lostfound.chmod(await getAdminClient(), 0o771);

    const groups = await Node.resolve(await getAdminClient(), "/groups");
    await groups.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
    await groups.chmod(await getAdminClient(), 0o770);

    const users = await Node.resolve(await getAdminClient(), "/users");
    await users.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
    await users.chmod(await getAdminClient(), 0o771);
};
