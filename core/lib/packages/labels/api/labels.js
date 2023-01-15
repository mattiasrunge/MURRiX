"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    assert(!client.isGuest(), "Permission denied");

    const nodes = await api.list(await getAdminClient(), "/labels/*");
    const labels = nodes.map((node) => ({
        name: node.name,
        count: node.properties.children.length
    }));

    if (abspath) {
        assert(await api.access(client, abspath, "r"), "Permission denied");

        const links = await Node.query(await getAdminClient(), {
            "properties.type": "s",
            "attributes.path": abspath
        });

        const labelNames = [ ...new Set(links
        .map(({ path }) => path)
        .filter((path) => path.startsWith("/labels/"))
        .map((path) => path.split("/")[2])) ];

        return labelNames
        .map((label) => labels.find(({ name }) => name === label));
    }

    return labels;
};
