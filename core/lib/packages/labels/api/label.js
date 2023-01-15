"use strict";

const path = require("path");
const assert = require("assert");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, label, abspath) => {
    assert(await api.access(client, abspath, "w"), "Permission denied");

    const nodes = await api.list(await getAdminClient(), `/labels/${label}`, {
        noerror: true,
        nofollow: true,
        query: {
            "attributes.path": abspath
        }
    });

    if (nodes.length > 0) {
        for (const node of nodes) {
            await api.unlink(await getAdminClient(), node.path);
        }

        const labelNode = await api.resolve(await getAdminClient(), `/labels/${label}`);

        if (labelNode.properties.children.length === 0) {
            await api.unlink(await getAdminClient(), `/labels/${label}`);
        }

        return false;
    }

    await api.ensure(await getAdminClient(), `/labels/${label}`, "d");
    await api.chmod(await getAdminClient(), `/labels/${label}`, 0o775);
    await api.symlink(await getAdminClient(), abspath, `/labels/${label}/${path.basename(abspath)}`);

    return true;
};
