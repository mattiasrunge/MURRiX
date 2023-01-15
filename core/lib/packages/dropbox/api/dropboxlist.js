"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");
const { list } = require("../../../lib/dropbox");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const user = await Node.resolve(await getAdminClient(), `/users/${client.getUsername()}`);

    assert(user, `No user found, with username ${client.getUsername()}, strange...`);
    assert(user.attributes.dropbox, "Dropbox is not configured");

    return list(user.attributes.dropbox.token, user.attributes.dropbox.folder);
};
