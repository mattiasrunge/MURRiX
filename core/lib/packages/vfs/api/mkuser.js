"use strict";

const Node = require("../../../core/Node");
const { GID_GUEST, GID_USERS } = require("../../../lib/auth");
const { api } = require("../../../api");

module.exports = async (client, username, fullname) => {
    const users = await Node.resolve(client, "/users");

    const user = await users.createChild(client, "u", username, {
        gid: GID_USERS,
        name: fullname
    });

    if (user.attributes.gid === GID_GUEST) {
        await api.groupjoin(client, "guest", user.name);
    } else if (user.attributes.gid === GID_USERS) {
        await api.groupjoin(client, "users", user.name);
    }

    await user.chown(client, user.attributes.uid);
    await user.chmod(client, 0o570);

    const filedir = await api.ensure(client, `${user.path}/files`, "d");
    await filedir.chown(client, user.attributes.uid);
    await filedir.chmod(client, 0o770);

    return user.serialize(client);
};
