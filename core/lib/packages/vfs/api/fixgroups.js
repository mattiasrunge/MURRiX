"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { ADMIN_CLIENT, GID_ADMIN, UID_ADMIN } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const groupdir = await Node.resolve(ADMIN_CLIENT, "/groups");
    await groupdir.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
    await groupdir.chmod(ADMIN_CLIENT, 0o770);

    const groups = await Node.list(ADMIN_CLIENT, "/groups");

    for (const group of groups) {
        await group.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
        await group.chmod(ADMIN_CLIENT, 0o770);

        const usersdir = await api.ensure(ADMIN_CLIENT, `${group.path}/users`, "d");
        await usersdir.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
        await usersdir.chmod(ADMIN_CLIENT, 0o770);

        const users = await Node.list(ADMIN_CLIENT, `${group.path}/users`);

        for (const user of users) {
            try {
                await api.groupleave(ADMIN_CLIENT, group.name, user.name);
            } catch {}

            await api.groupjoin(ADMIN_CLIENT, group.name, user.name);
        }
    }
};
