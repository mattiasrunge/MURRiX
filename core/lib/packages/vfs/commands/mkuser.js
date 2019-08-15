"use strict";

const Node = require("../../../core/Node");
const { GID_GUEST, GID_USERS } = require("../../../core/auth");
const usermod = require("./usermod");
const ensure = require("./ensure");

module.exports = async (client, username, fullname) => {
    const users = await Node.resolve(client, "/users");

    const user = await users.createChild(client, "u", username, {
        gid: GID_USERS,
        name: fullname
    });

    if (user.attributes.gid === GID_GUEST) {
        await usermod(client, user.name, "guest");
    } else if (user.attributes.gid === GID_USERS) {
        await usermod(client, user.name, "users");
    }

    await user.chown(client, user.attributes.uid);
    await user.chmod(client, 0o570);

    const filedir = await ensure(client, `${user.path}/files`, "d");
    await filedir.chown(client, user.attributes.uid);
    await filedir.chmod(client, 0o770);

    return user.serialize(client);
};
