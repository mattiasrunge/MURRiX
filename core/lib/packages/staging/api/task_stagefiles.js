"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs-extra");
const Node = require("../../../lib/Node");
const log = require("../../../lib/log")(module);
const { api } = require("../../../api");
const config = require("../../../config");
const { Client } = require("../../../auth");

module.exports = async (client, taskNode) => {
    assert(client.isAdmin(), "Permission denied");
    assert(config.stagingDirectory, "Staging is disabled");

    let didWork = false;
    const usernames = await fs.readdir(config.stagingDirectory);

    for (const username of usernames) {
        const user = await api.resolve(client, `/users/${username}`, {
            noerror: true
        });

        if (!user) {
            log.error(`Could not find a user with username ${username}, please remove it from the staging folder...`);
            continue;
        }

        const userClient = new Client({});
        const grps = await api.groups(client, username);

        userClient.setUser({
            username,
            uid: user.attributes.uid,
            gid: user.attributes.gid,
            gids: grps.map((group) => group.attributes.gid)
        });

        const filesPath = `/users/${username}/files`;
        await api.ensure(userClient, filesPath, "d");

        const directory = path.join(config.stagingDirectory, username);
        const allFiles = await fs.readdir(directory);
        const files = allFiles.filter((f) => !f.startsWith("."));

        if (files.length > 0) {
            log.info(`Task stage files found ${files.length} files for ${username} that will be imported`);

            for (const file of files) {
                const filename = path.join(directory, file);
                const name = await api.uniquename(filesPath, file);
                const node = await api.create(userClient, filesPath, "f", name, {
                    name: file,
                    _source: {
                        filename
                    }
                });

                await api.regenerate(userClient, node.path);

                didWork = true;
            }
        }
    }

    return didWork;
};
