import Node from "../../../lib/Node.mjs";

export default async (client, abspath, name) => {
    const node = await Node.resolve(client, abspath);

    return node.getUniqueChildName(client, name);
};
