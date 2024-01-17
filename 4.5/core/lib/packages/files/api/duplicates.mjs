import assert from "node:assert";
import Node from "../../../lib/Node.mjs";

export default async (client, abspath, options = {}) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Metadata must be run on a file");

    if (!node.attributes.sha1) {
        return options.count ? 0 : [];
    }

    const nodes = await Node.query(client, {
        "attributes.sha1": node.attributes.sha1
    }, {
        nolookup: !!options.count
    });

    const list = nodes.filter(({ _id }) => _id !== node._id);

    if (options.count) {
        return list.length;
    }

    return list.map(({ path }) => path);
};
