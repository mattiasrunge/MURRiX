import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";
import { createLog } from "../../../lib/log.mjs";

const log = createLog(import.meta.url);

export default async (client, abspath) => {
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
