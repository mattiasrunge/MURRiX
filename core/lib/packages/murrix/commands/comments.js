"use strict";

const path = require("path");
const access = require("../../vfs/commands/access");
const list = require("../../vfs/commands/list");
const users = require("../../vfs/commands/users");
const resolve = require("../../vfs/commands/resolve");
const { ADMIN_CLIENT } = require("../../../core/auth");

module.exports = async (client, abspath) => {
    if (!(await access(client, abspath, "r"))) {
        throw new Error("Permission denied");
    }

    const usrs = await users(ADMIN_CLIENT);

    try {
        const comments = await list(ADMIN_CLIENT, path.join(abspath, "comments"));

        const promises = comments.map(async (comment) => {
            const user = usrs.find((user) => user.attributes.uid === comment.properties.birthuid);
            const avatar = await resolve(ADMIN_CLIENT, `${user.path}/person/profilePicture`, { noerror: true });

            return {
                time: comment.properties.birthtime,
                text: comment.attributes.text,
                name: user.attributes.name,
                avatar: avatar ? avatar.path : false
            };
        });

        return await Promise.all(promises);
    } catch {}

    return [];
};
