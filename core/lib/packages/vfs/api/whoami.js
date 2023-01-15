"use strict";

const path = require("path");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    const dir = path.join("/users", client.getUsername());
    const user = await api.resolve(await getAdminClient(), dir);

    const personPath = path.join(dir, "person");
    const person = await api.resolve(await getAdminClient(), personPath, {
        noerror: true
    });

    user.adminGranted = client.isAdmin();
    user.personPath = person ? person.path : false;
    user.isGuest = user.name === "guest";

    return user;
};
