"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT, GID_ADMIN, UID_ADMIN } = require("../../../core/auth");
const ensure = require("./ensure");
const usermod = require("./usermod");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const groupdir = await Node.resolve(ADMIN_CLIENT, "/groups");
    await groupdir.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
    await groupdir.chmod(ADMIN_CLIENT, 0o770);

    const groups = await Node.list(ADMIN_CLIENT, "/groups");

    for (const group of groups) {
        await group.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
        await group.chmod(ADMIN_CLIENT, 0o770);

        const usersdir = await ensure(ADMIN_CLIENT, `${group.path}/users`, "d");
        await usersdir.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
        await usersdir.chmod(ADMIN_CLIENT, 0o770);

        const users = await Node.list(ADMIN_CLIENT, `${group.path}/users`);

        for (const user of users) {
            try {
                await usermod(ADMIN_CLIENT, user.name, group.name, true);
            } catch {}

            await usermod(ADMIN_CLIENT, user.name, group.name);
        }
    }
};
