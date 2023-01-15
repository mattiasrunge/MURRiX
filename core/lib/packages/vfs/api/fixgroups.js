"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient, GID_ADMIN, UID_ADMIN } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const groupdir = await Node.resolve(await getAdminClient(), "/groups");
    await groupdir.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
    await groupdir.chmod(await getAdminClient(), 0o770);

    const groups = await Node.list(await getAdminClient(), "/groups");

    for (const group of groups) {
        await group.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
        await group.chmod(await getAdminClient(), 0o770);

        const usersdir = await api.ensure(await getAdminClient(), `${group.path}/users`, "d");
        await usersdir.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
        await usersdir.chmod(await getAdminClient(), 0o770);

        const users = await Node.list(await getAdminClient(), `${group.path}/users`);

        for (const user of users) {
            try {
                await api.groupleave(await getAdminClient(), group.name, user.name);
            } catch {}

            await api.groupjoin(await getAdminClient(), group.name, user.name);
        }
    }
};
