import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, type, name, attributes = {}) => {
    const parent = await Node.resolve(client, abspath);
    const node = await parent.createChild(client, type, name, attributes);

    return api.regenerate(client, node.path);
};
