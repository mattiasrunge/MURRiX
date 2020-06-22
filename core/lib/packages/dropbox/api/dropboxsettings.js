"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { ADMIN_CLIENT } = require("../../../auth");
const { account, space } = require("../../../lib/dropbox");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const user = await Node.resolve(ADMIN_CLIENT, `/users/${client.getUsername()}`);

    assert(user, `No user found, with username ${client.getUsername()}, strange...`);

    if (!user.attributes.dropbox) {
        return false;
    }

    const accountData = await account(user.attributes.dropbox.token);
    const spaceData = await space(user.attributes.dropbox.token);

    return {
        folder: user.attributes.dropbox.folder,
        account: accountData,
        space: spaceData
    };
};
