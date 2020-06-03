"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const people = await Node.list(client, "/people");

    for (const person of people) {
        const children = await Node.list(client, `${person.path}/children`, {
            nofollow: true,
            query: {
                "properties.group": { $exists: false }
            }
        });

        for (const child of children) {
            await api.groupnodes(client, [
                child,
                `${child.attributes.path}/parents/${person.name}`
            ]);
        }
    }
};
