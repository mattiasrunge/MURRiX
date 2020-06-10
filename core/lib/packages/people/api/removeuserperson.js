"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Get only remove a person on a user");

    if (await api.exists(client, `${abspath}/person`)) {
        await api.unlink(client, `${abspath}/person`);
    }
};
