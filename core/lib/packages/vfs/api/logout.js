"use strict";

const Node = require("../../../lib/Node");
const { getAdminClient, USERNAME_GUEST } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    const user = await Node.resolve(await getAdminClient(), `/users/${USERNAME_GUEST}`);
    const grps = await api.groups(await getAdminClient(), USERNAME_GUEST);

    client.setUser({
        username: USERNAME_GUEST,
        uid: user.attributes.uid,
        gid: user.attributes.gid,
        gids: grps.map((group) => group.attributes.gid)
    });

    return user.serialize(client);
};
