import Node from "../../../lib/Node.mjs";

export default async (client, abspath, ac, options = {}) => {
    const node = await Node.resolve(client, abspath);

    await node.setfacl(client, ac, options);
};
