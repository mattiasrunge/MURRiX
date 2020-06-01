"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, partnerpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    await node.assertAccess(client, "w");

    const partner = await api.resolve(client, `${abspath}/partner`, { noerror: true });

    // If there is an existing partner
    if (partner) {
        // Remove partner link
        await api.unlink(client, `${abspath}/partner`);

        // Remove current partners partner symlink
        // It is assumed that the current partner link points to an abspath
        await api.unlink(client, `${partner.path}/partner`);
    }

    // If a new partner has been specified
    if (partnerpath) {
        // Remove new partners existing partner
        await module.exports(client, partnerpath);

        // Create new partner links
        await api.symlink(client, abspath, `${partnerpath}/partner`);
        await api.symlink(client, partnerpath, `${abspath}/partner`);

        return await api.resolve(client, partnerpath, { noerror: true });
    }

    return null;
};
