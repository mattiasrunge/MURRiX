"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, abspath) => {
    const labels = await Node.labels(client);

    if (abspath) {
        const node = await Node.resolve(client, abspath);

        return node.attributes.labels
        .filter((name) => name)
        .map((name) => labels.find((label) => label.name === name));
    }

    return labels;
};
