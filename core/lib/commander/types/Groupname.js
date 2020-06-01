"use strict";

const { api } = require("../../api");
const Generic = require("./Generic");

class Groupname extends Generic {
    static async completer(client, partial) {
        const groups = await api.groups(client);

        const names = groups
        .map(({ name }) => name)
        .filter((name) => name.startsWith(partial));

        if (names.length === 1 && names[0] === partial) {
            return [ [ " " ], "" ];
        }

        return [ names, partial ];
    }
}

module.exports = Groupname;
