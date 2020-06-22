"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const dropbox = require("../../../lib/dropbox");
const { ADMIN_CLIENT } = require("../../../auth");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const user = await Node.resolve(ADMIN_CLIENT, `/users/${client.getUsername()}`);

    assert(user, `No user found, with username ${client.getUsername()}, strange...`);

    if (!user.attributes.dropbox) {
        return;
    }

    await dropbox.revoke(user.attributes.dropbox.token);

    await user.update(ADMIN_CLIENT, { dropbox: null }, true);
};
