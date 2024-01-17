import Node from "../../../lib/Node.mjs";

export default async (client, abspath, options = {}) => {
    const node = await Node.resolve(client, abspath, options);

    return await node.revisions(client);
};
