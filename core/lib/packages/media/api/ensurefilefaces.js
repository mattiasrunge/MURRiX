"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const log = require("../../../lib/log")(module);
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only ensure faces for files");

    if (!node.attributes.faces) {
        log.info(`No face info found for ${node.path}, will try to detect...`);
        let faces = [];

        try {
            faces = await api.detectfaces(client, node);
        } catch (error) {
            log.error(`Failed to detect faces for ${node.path}, will write empty list instead`, error);
        }

        await node.update(client, { faces });

        return faces;
    }

    return node.attributes.faces;
};
