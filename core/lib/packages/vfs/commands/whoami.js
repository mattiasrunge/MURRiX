"use strict";

const path = require("path");
const { ADMIN_CLIENT } = require("../../../core/auth");
const resolve = require("./resolve");

module.exports = async (client) => {
    const dir = path.join("/users", client.getUsername());
    const user = await resolve(ADMIN_CLIENT, dir);

    const personPath = path.join(dir, "person");
    const person = await resolve(ADMIN_CLIENT, personPath, {
        noerror: true
    });

    user.adminGranted = client.isAdmin();
    user.personPath = person ? person.path : false;

    return user;
};
