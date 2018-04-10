"use strict";

const assert = require("assert");
const { Node } = require("../../vfs");
const resolve = require("../../vfs/commands/resolve");
const unlink = require("../../vfs/commands/unlink");
const symlink = require("../../vfs/commands/symlink");

module.exports = async (session, abspath, partnerpath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    await node.assertAccess(session, "w");

    const partner = await resolve(session, `${abspath}/partner`, { noerror: true });

    // If there is an existing partner
    if (partner) {
        // Remove partner link
        await unlink(session, `${abspath}/partner`);

        // Remove current partners partner symlink
        // It is assumed that the current partner link points to an abspath
        await unlink(session, `${partner.path}/partner`);
    }

    // If a new partner has been specified
    if (partnerpath) {
        // Remove new partners existing partner
        await module.exports(session, partnerpath);

        // Create new partner links
        await symlink(session, abspath, `${partnerpath}/partner`);
        await symlink(session, partnerpath, `${abspath}/partner`);

        return await resolve(session, partnerpath, { noerror: true });
    }

    return null;
};
