"use strict";

const path = require("path");
const assert = require("assert");
const { ADMIN_CLIENT } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, label, abspath) => {
    assert(await api.access(client, abspath, "w"), "Permission denied");

    const nodes = await api.list(ADMIN_CLIENT, `/labels/${label}`, {
        noerror: true,
        nofollow: true,
        query: {
            "attributes.path": abspath
        }
    });

    if (nodes.length > 0) {
        for (const node of nodes) {
            await api.unlink(ADMIN_CLIENT, node.path);
        }

        const labelNode = await api.resolve(ADMIN_CLIENT, `/labels/${label}`);

        if (labelNode.properties.children.length === 0) {
            await api.unlink(ADMIN_CLIENT, `/labels/${label}`);
        }

        return false;
    }

    await api.ensure(ADMIN_CLIENT, `/labels/${label}`, "d");
    await api.chmod(ADMIN_CLIENT, `/labels/${label}`, 0o775);
    await api.symlink(ADMIN_CLIENT, abspath, `/labels/${label}/${path.basename(abspath)}`);

    return true;
};
