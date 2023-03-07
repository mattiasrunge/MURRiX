import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, attributes) => {
    const node = await Node.resolve(client, abspath, { readlink: true });

    await node.update(client, attributes);

    return api.regenerate(client, node.path);
};
