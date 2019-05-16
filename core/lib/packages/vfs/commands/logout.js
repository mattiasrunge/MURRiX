"use strict";

const Node = require("../../../core/Node");
const { ADMIN_CLIENT, USERNAME_GUEST } = require("../../../core/auth");
const groups = require("./groups");

module.exports = async (client) => {
    const user = await Node.resolve(ADMIN_CLIENT, `/users/${USERNAME_GUEST}`);
    const grps = await groups(ADMIN_CLIENT, USERNAME_GUEST);

    client.setUser({
        username: USERNAME_GUEST,
        uid: user.attributes.uid,
        gid: user.attributes.gid,
        gids: grps.map((group) => group.attributes.gid)
    });

    return user.serialize(client);
};
