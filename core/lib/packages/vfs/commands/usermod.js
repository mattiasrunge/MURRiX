"use strict";

const symlink = require("./symlink");
const unlink = require("./unlink");

module.exports = async (client, username, groupname, remove = false) => {
    if (remove) {
        await unlink(client, `/users/${username}/groups/${groupname}`);
        await unlink(client, `/groups/${groupname}/users/${username}`);
    } else {
        await symlink(client, `/groups/${groupname}`, `/users/${username}/groups`);
        await symlink(client, `/users/${username}`, `/groups/${groupname}/users`);
    }
};
