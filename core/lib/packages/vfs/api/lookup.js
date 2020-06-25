"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const log = require("../../../lib/log")(module);

module.exports = async (client, id, options) => {
    const nodes = await Node.lookup(client, id);

    if (options.fix) {
        assert(client.isAdmin(), "Only admin can fix ref counts");

        if (nodes.length > 0 && nodes[0].properties.count !== nodes.length) {
            log.info(`Count for node ${nodes[0]._id} did not match the returned number of paths ${nodes.length}, will fix...`);

            await nodes[0]._props(client, { count: nodes.length });

            nodes.forEach((node) => node.properties.count = nodes.length);
        }
    }

    return await Promise.all(nodes.map((node) => node.serialize(client)));
};
