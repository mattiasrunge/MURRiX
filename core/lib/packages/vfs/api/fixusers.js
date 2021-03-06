"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { ADMIN_CLIENT, GID_ADMIN, UID_ADMIN } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const userdir = await Node.resolve(ADMIN_CLIENT, "/users");
    await userdir.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
    await userdir.chmod(ADMIN_CLIENT, 0o771);

    const users = await Node.list(ADMIN_CLIENT, "/users");

    for (const user of users) {
        await user.chown(ADMIN_CLIENT, user.attributes.uid, GID_ADMIN);
        await user.chmod(ADMIN_CLIENT, 0o570);

        const filedir = await api.ensure(ADMIN_CLIENT, `${user.path}/files`, "d");
        await filedir.chown(ADMIN_CLIENT, user.attributes.uid, GID_ADMIN);
        await filedir.chmod(ADMIN_CLIENT, 0o770);

        const starsdir = await api.ensure(ADMIN_CLIENT, `${user.path}/stars`, "d");
        await starsdir.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
        await starsdir.chmod(ADMIN_CLIENT, 0o770);

        const groupsdir = await api.ensure(ADMIN_CLIENT, `${user.path}/groups`, "d");
        await groupsdir.chown(ADMIN_CLIENT, UID_ADMIN, GID_ADMIN);
        await groupsdir.chmod(ADMIN_CLIENT, 0o770);

        const groups = await Node.list(ADMIN_CLIENT, `${user.path}/groups`);

        for (const group of groups) {
            try {
                await api.groupleave(ADMIN_CLIENT, group.name, user.name);
            } catch {}

            await api.groupjoin(ADMIN_CLIENT, group.name, user.name);
        }
    }
};
