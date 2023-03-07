import path from "node:path";
import Node from "../../../lib/Node.mjs";

export default async (client, abspath, type, attributes = {}) => {
    try {
        return await Node.resolve(client, abspath);
    } catch {
        const parentPath = path.dirname(abspath);
        const name = path.basename(abspath);

        const parent = await Node.resolve(client, parentPath);

        return await parent.createChild(client, type, name, attributes);
    }
};
