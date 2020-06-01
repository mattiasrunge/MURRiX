"use strict";

const { api } = require("../../api");
const Generic = require("./Generic");

class UserGroup extends Generic {
    static async completer(client, partial) {
        const user = partial;

        // We have a : so we should complete the group
        if (partial.includes(":")) {
            const [ , group ] = partial.split(":");

            const groups = await api.groups(client);

            const names = groups
            .map(({ name }) => name)
            .filter((name) => name.startsWith(group));

            if (names.length === 1 && names[0] === group) {
                return [ [ " " ], "" ];
            }

            return [ names, group ];
        }

        // We have no : so we should complete the user
        const users = await api.users(client);

        const names = users
        .map(({ name }) => name)
        .filter((name) => name.startsWith(user));

        // Complete an ending : if we have only one match and have the full name already
        if (names.length === 1 && names[0] === user) {
            return [ [ ":" ], "" ];
        }

        return [ names, user ];
    }

    // Does validation as well
    static async transform(client, value) {
        const str = `${value}`;
        let user = str;
        let group = false;

        if (str.includes(":")) {
            [ user, group ] = str.split(":");
        }

        let uid = user ? Number.parseInt(user, 10) : 0;
        let gid = group ? Number.parseInt(group, 10) : 0;

        uid = Number.isNaN(uid) ? (await api.uid(client, user)) : uid;
        gid = Number.isNaN(gid) ? (await api.gid(client, group)) : gid;

        return { uid, gid };
    }
}

module.exports = UserGroup;
