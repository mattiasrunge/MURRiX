"use strict";

const assert = require("assert");
const log = require("../../../lib/log")(module);
const { api } = require("../../../api");
const config = require("../../../config");
const { Client } = require("../../../auth");

module.exports = async (client /* , taskNode */) => {
    assert(client.isAdmin(), "Permission denied");
    assert(config.dropbox, "Dropbox is not configured");

    let didWork = false;
    const users = await api.list(client, "/users", {
        query: {
            "attributes.dropbox": { $exists: true }
        }
    });

    for (const user of users) {
        const userClient = new Client({});
        const grps = await api.groups(client, user.name);

        userClient.setUser({
            username: user.name,
            uid: user.attributes.uid,
            gid: user.attributes.gid,
            gids: grps.map((group) => group.attributes.gid)
        });

        const paths = await api.dropboxstagefiles(userClient);

        if (paths.length > 0) {
            log.info(`Staged ${paths.length} files for ${user.name}`);
        }

        didWork = didWork || paths.length > 0;
    }

    return didWork;
};
