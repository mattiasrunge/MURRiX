"use strict";

const { api } = require("../../api");
const Generic = require("./Generic");

class Task extends Generic {
    static async completer(client, partial) {
        const tasks = await api.list(client, `/system/tasks/${partial}*`);

        const names = tasks
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

        return await api.resolve(client, `/system/tasks/${value}`);
    }
}

module.exports = Task;
