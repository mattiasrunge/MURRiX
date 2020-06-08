"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const log = require("../../../lib/log")(module);
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    // db.nodes.update({ "attributes.labels": [] }, { $unset: { "attributes.labels": "" } }, { multi: true })

    // eslint-disable-next-line no-constant-condition
    while (1) {
        const nodes = await Node.query(client, {
            "attributes.labels": { $exists: true }
        }, { limit: 10 });

        for (const node of nodes) {
            const labels = node.attributes.labels ?? [];

            try {
                for (const label of labels) {
                    if (label) {
                        await api.label(client, label, node.path);
                    }
                }

                node.update(client, {
                    labels: null
                });
            } catch (error) {
                log.error(`Failed to migrate labels for ${node.path}, will skip!`, error);
            }
        }
    }
};
