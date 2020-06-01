"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../lib/auth");
const { api } = require("../../../api");

module.exports = async (client, username, password) => {
    const user = await Node.resolve(ADMIN_CLIENT, `/users/${username}`);

    assert(!user.attributes.inactive, "Authentication failed");
    assert(user.attributes.password, "Authentication failed");
    assert(await user.matchPassword(password), "Authentication failed");

    const grps = await api.groups(ADMIN_CLIENT, username);

    client.setUser({
        username,
        uid: user.attributes.uid,
        gid: user.attributes.gid,
        gids: grps.map((group) => group.attributes.gid)
    });

    await user.updateLoginTime(ADMIN_CLIENT);

    return user.serialize(client);
};
