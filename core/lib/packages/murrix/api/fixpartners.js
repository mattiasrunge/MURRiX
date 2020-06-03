"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const people = await Node.list(client, "/people");

    for (const person of people) {
        try {
            const partner = await Node.resolve(client, `${person.path}/partner`, {
                nofollow: true,
                query: {
                    "properties.group": { $exists: false }
                }
            });

            if (partner) {
                await api.groupnodes(client, [
                    partner,
                    `${partner.attributes.path}/partner`
                ]);
            }
        } catch {}
    }
};
