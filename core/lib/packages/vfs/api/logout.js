"use strict";

const Node = require("../../../core/Node");
const { ADMIN_CLIENT, USERNAME_GUEST } = require("../../../lib/auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    const user = await Node.resolve(ADMIN_CLIENT, `/users/${USERNAME_GUEST}`);
    const grps = await api.groups(ADMIN_CLIENT, USERNAME_GUEST);

    client.setUser({
        username: USERNAME_GUEST,
        uid: user.attributes.uid,
        gid: user.attributes.gid,
        gids: grps.map((group) => group.attributes.gid)
    });

    return user.serialize(client);
};
