"use strict";

const symlink = require("./symlink");
const unlink = require("./unlink");

module.exports = async (client, username, groupname, remove = false) => {
    if (remove) {
        // TODO: Disallow removing admin from the admin group
        // TODO: Disallow removing guest from the gues group

        await unlink(client, `/users/${username}/groups/${groupname}`);
        await unlink(client, `/groups/${groupname}/users/${username}`);
    } else {
        // TODO: Disallow joining the admin group
        // TODO: Disallow joining the guest group

        await symlink(client, `/groups/${groupname}`, `/users/${username}/groups`);
        await symlink(client, `/users/${username}`, `/groups/${groupname}/users`);
    }
};
