"use strict";

const Node = require("../../../lib/Node");

class Task extends Node {
    // Private

    static async _createData(client, parent, type, attributes = {}) {
        const data = await super._createData(client, parent, type, attributes);

        data.attributes = {
            enabled: false,
            command: "",
            ...data.attributes
        };

        return data;
    }
}

Task.IDENTIFIER = "j";
Task.VERSION = 1;

module.exports = Task;
