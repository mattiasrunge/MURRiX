"use strict";

const assert = require("assert");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Toggle label on node
    opts,
    label, // Generic
    abspath = "" // AbsolutePath
) => {
    const node = await api.resolve(client, abspath, { nofollow: opts.l });

    assert(node.properties.type !== "r", "Can not label the root node");

    const index = node.attributes.labels.indexOf(label);
    const labels = node.attributes.labels.slice(0);

    if (index === -1) {
        labels.push(label);
    } else {
        labels.splice(index, 1);
    }

    await api.update(client, abspath, { labels });
};
