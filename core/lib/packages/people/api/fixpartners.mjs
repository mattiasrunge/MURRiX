import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client) => {
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
