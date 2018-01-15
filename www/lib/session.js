"use strict";

const api = require("api.io/api.io-client");

let user = false;

module.exports = {
    user: () => user,
    username: () => user ? user.name : "guest",
    adminGranted: () => user && user.adminGranted,
    loadUser: async () => user = await api.vfs.whoami(),
    init: async () => {
        await module.exports.loadUser();

        api.vfs.on("session.updated", (username) => {
            if (username !== module.exports.username()) {
                module.exports.loadUser();
            }
        });
    }
};
