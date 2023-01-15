"use strict";

const path = require("path");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    if (!(await api.access(client, abspath, "r"))) {
        throw new Error("Permission denied");
    }

    const usrs = await api.users(await getAdminClient());

    try {
        const comments = await api.list(await getAdminClient(), path.join(abspath, "comments"));

        const promises = comments.map(async (comment) => {
            const user = usrs.find((user) => user.attributes.uid === comment.properties.birthuid);

            // TODO: Maybe we should remove this to keep dependencies clear? Lookup picuture in ui
            // or redo the profilePicture add it to the user directly and just depend on File
            const avatar = await api.resolve(await getAdminClient(), `${user.path}/person/profilePicture`, { noerror: true });

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
