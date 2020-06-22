"use strict";

const assert = require("assert");
const { v4: uuid } = require("uuid");
const Node = require("../../../lib/Node");
const dropbox = require("../../../lib/dropbox");
const { ADMIN_CLIENT } = require("../../../auth");

module.exports = async (client, baseUrl, folder) => {
    assert(!client.isGuest(), "Permission denied");

    const user = await Node.resolve(ADMIN_CLIENT, `/users/${client.getUsername()}`);

    assert(user, `No user found, with username ${client.getUsername()}, strange...`);

    await user.update(ADMIN_CLIENT, { dropbox: null }, true);

    const id = uuid();
    const url = dropbox.authenticate(baseUrl, async (error, token) => {
        try {
            if (error) {
                throw error;
            }

            const user = await Node.resolve(ADMIN_CLIENT, `/users/${client.getUsername()}`);

            await user.update(ADMIN_CLIENT, {
                dropbox: {
                    token,
                    folder
                }
            });

            await client.sendEvent("dropbox.auth", {
                id: id,
                success: true
            });
        } catch {
            await client.sendEvent("dropbox.auth", {
                id: id,
                success: false
            });
        }
    });

    return {
        url,
        id
    };
};
