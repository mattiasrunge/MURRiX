"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, partnerpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    await node.assertAccess(client, "w");

    await api.unlink(client, `${abspath}/partner`);

    // If a new partner has been specified
    if (partnerpath) {
        // Remove new partners existing partner
        await module.exports(client, partnerpath);

        // Create new partner links
        const s1 = await api.symlink(client, abspath, `${partnerpath}/partner`);
        const s2 = await api.symlink(client, partnerpath, `${abspath}/partner`);

        await api.groupnodes(client, [ s1, s2 ]);

        return await api.resolve(client, partnerpath, { noerror: true });
    }

    return null;
};
