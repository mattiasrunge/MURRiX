"use strict";

const Node = require("../lib/Node");
const { GID_GUEST, GID_USERS } = require("../lib/auth");
const usermod = require("./usermod");

module.exports = async (session, username, fullname) => {
    const users = await Node.resolve(session, "/users");

    const user = await users.createChild(session, "u", username, {
        gid: GID_USERS,
        name: fullname
    });

    if (user.attributes.gid === GID_GUEST) {
        await usermod(session, user.name, "guest");
    } else if (user.attributes.gid === GID_USERS) {
        await usermod(session, user.name, "users");
    }

    return user.serialize(session);
};
