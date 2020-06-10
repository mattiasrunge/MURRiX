"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, personpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Get only set a person on a user");

    await api.removeuserperson(client, abspath);
    await api.symlink(client, personpath, `${abspath}/person`);
};
