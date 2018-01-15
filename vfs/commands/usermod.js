"use strict";

const symlink = require("./symlink");
const unlink = require("./unlink");

module.exports = async (session, username, groupname, remove = false) => {
    if (remove) {
        await unlink(session, `/users/${username}/groups`);
        await unlink(session, `/groups/${groupname}/users`);
    } else {
        await symlink(session, `/groups/${groupname}`, `/users/${username}/groups`);
        await symlink(session, `/users/${username}`, `/groups/${groupname}/users`);
    }
};
