"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { api } = require("../../../api");

// TODO: This loads lots of duplicates (slow), should be avoided if possible; maybe load the symlinks, then make unique before loading the people nodes

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "a", "Can only get album tags for albums");

    const files = await api.list(client, `${abspath}/files`);
    const tags = {};

    const tagsByFile = await Promise.all(files.map((file) => api.list(client, `${file.path}/tags`)));

    const allTags = tagsByFile.flat();

    for (const tag of allTags) {
        tags[tag._id] = tag;
    }

    const nodes = Object.values(tags);

    nodes.sort((a, b) => a.attributes.name.localeCompare(b.attributes.name));

    return nodes;
};
