"use strict";

const Node = require("../../../core/Node");
const { GID_GUEST, GID_USERS } = require("../../../core/auth");
const usermod = require("./usermod");

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

    return user.serialize(client);
};
