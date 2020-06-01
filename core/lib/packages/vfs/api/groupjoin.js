"use strict";

const { api } = require("../../../api");

module.exports = async (client, groupname, username) => {
    await api.symlink(client, `/groups/${groupname}`, `/users/${username}/groups/${groupname}`);
    await api.symlink(client, `/users/${username}`, `/groups/${groupname}/users/${username}`);
};
