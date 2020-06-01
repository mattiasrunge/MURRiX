"use strict";

const { api } = require("../../api");
const Generic = require("./Generic");

class Username extends Generic {
    static async completer(client, partial) {
        const users = await api.users(client);

        const names = users
        .map(({ name }) => name)
        .filter((name) => name.startsWith(partial));

        if (names.length === 1 && names[0] === partial) {
            return [ [ " " ], "" ];
        }

        return [ names, partial ];
    }

    static async transform(client, value) {
        if (value.length === 0) {
            return client.getUsername();
        }

        return value;
    }
}

module.exports = Username;
