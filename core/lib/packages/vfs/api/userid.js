"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, username) => {
    assert(!client.isGuest(), "Permission denied");

    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);
    const grps = await api.groups(await getAdminClient(), username);

    return {
        uid: {
            id: user.attributes.uid,
            name: username
        },
        gid: {
            id: user.attributes.gid,
            name: grps.filter((group) => group.attributes.gid === user.attributes.gid).map((group) => group.name)[0] || ""
        },
        gids: grps.map((group) => ({
            id: group.attributes.gid,
            name: group.name
        }))
    };
};
