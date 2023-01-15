"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, username, password) => {
    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);

    assert(!user.attributes.inactive, "Authentication failed");
    assert(user.attributes.password, "Authentication failed");
    assert(await user.matchPassword(password), "Authentication failed");

    const grps = await api.groups(await getAdminClient(), username);

    client.setUser({
        username,
        uid: user.attributes.uid,
        gid: user.attributes.gid,
        gids: grps.map((group) => group.attributes.gid)
    });

    await user.updateLoginTime(await getAdminClient());

    return user.serialize(client);
};
