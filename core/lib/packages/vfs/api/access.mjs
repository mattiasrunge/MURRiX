import Node from "../../../lib/Node.mjs";

export default async (client, abspath, level) => {
    try {
        const node = await Node.resolve(client, abspath);

        return node.hasAccess(client, level);
    } catch {}

    return false;
};
