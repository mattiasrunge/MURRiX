"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../log")(module);
const detectfaces = require("./detectfaces");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only ensure faces for files");

    if (!node.attributes.faces) {
        log.info(`No face info found for ${node.path}, will try to detect...`);
        let faces = [];

        try {
            faces = await detectfaces(client, node);
        } catch (error) {
            log.error(`Failed to detect faces for ${node.path}, will write empty list instead`);
        }

        await node.update(client, { faces });

        return faces;
    }

    return node.attributes.faces;
};
