"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../log")(module);
const detectfaces = require("./detectfaces");

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "f", "Can only ensure faces for files");

    if (!node.attributes.faces) {
        log.info(`No face info found for ${node.path}, will try to detect...`);
        let faces = [];

        try {
            faces = await detectfaces(session, node);
        } catch (error) {
            log.error(`Failed to detect faces for ${node.path}, will write empty list instead`);
        }

        await node.update(session, { faces });

        return faces;
    }

    return node.attributes.faces;
};
