"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient, GID_ADMIN, UID_ADMIN } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const userdir = await Node.resolve(await getAdminClient(), "/users");
    await userdir.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
    await userdir.chmod(await getAdminClient(), 0o771);

    const users = await Node.list(await getAdminClient(), "/users");

    for (const user of users) {
        await user.chown(await getAdminClient(), user.attributes.uid, GID_ADMIN);
        await user.chmod(await getAdminClient(), 0o570);

        const filedir = await api.ensure(await getAdminClient(), `${user.path}/files`, "d");
        await filedir.chown(await getAdminClient(), user.attributes.uid, GID_ADMIN);
        await filedir.chmod(await getAdminClient(), 0o770);

        const starsdir = await api.ensure(await getAdminClient(), `${user.path}/stars`, "d");
        await starsdir.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
        await starsdir.chmod(await getAdminClient(), 0o770);

        const groupsdir = await api.ensure(await getAdminClient(), `${user.path}/groups`, "d");
        await groupsdir.chown(await getAdminClient(), UID_ADMIN, GID_ADMIN);
        await groupsdir.chmod(await getAdminClient(), 0o770);

        const groups = await Node.list(await getAdminClient(), `${user.path}/groups`);

        for (const group of groups) {
            try {
                await api.groupleave(await getAdminClient(), group.name, user.name);
            } catch {}

            await api.groupjoin(await getAdminClient(), group.name, user.name);
        }
    }
};
