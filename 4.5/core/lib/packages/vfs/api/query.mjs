import Node from "../../../lib/Node.mjs";

export default async (client, query, options) => {
    const nodes = await Node.query(client, query, options);

    return Promise.all(nodes.map((node) => node.serialize(client)));
};
