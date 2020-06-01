"use strict";

const { api } = require("../../api");
const Generic = require("./Generic");

class Person extends Generic {
    static async completer(client, partial) {
        const persons = await api.list(client, `/people/${partial}*`);

        const names = persons
        .map(({ name }) => name);

        if (names.length === 1 && names[0] === partial) {
            return [ [ " " ], "" ];
        }

        return [ names, partial ];
    }

    static async transform(client, value) {
        if (!value) {
            return null;
        }

        return await api.resolve(client, `/people/${value}`);
    }
}

module.exports = Person;
