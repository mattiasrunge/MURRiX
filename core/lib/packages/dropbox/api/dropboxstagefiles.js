"use strict";

const Node = require("../../../lib/Node");
const { ADMIN_CLIENT } = require("../../../auth");
const { download, remove } = require("../../../lib/dropbox");
const { api } = require("../../../api");
const config = require("../../../config");

module.exports = async (client, limit = 10) => {
    const files = await api.dropboxlist(client);
    const user = await Node.resolve(ADMIN_CLIENT, `/users/${client.getUsername()}`);
    const filesPath = `/users/${client.getUsername()}/files`;
    const staged = [];

    await api.ensure(client, filesPath, "d");

    let counter = 0;

    for (const file of files) {
        const filename = await download(user.attributes.dropbox.token, file, config.uploadDirectory);
        const name = await api.uniquename(client, filesPath, file.name);
        const node = await api.create(client, filesPath, "f", name, {
            name: file.name,
            _source: {
                filename
            }
        });

        staged.push(node.path);

        await remove(user.attributes.dropbox.token, file);

        counter++;

        if (counter >= limit) {
            break;
        }
    }

    return staged;
};
