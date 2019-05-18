"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");
const groups = require("./groups");

module.exports = async (client, username) => {
    assert(!client.sGuest(), "Permission denied");

    const user = await Node.resolve(ADMIN_CLIENT, `/users/${username}`);
    const grps = await groups(ADMIN_CLIENT, username);

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