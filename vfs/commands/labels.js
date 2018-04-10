"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath) => {
    const labels = await Node.labels(session);

    if (abspath) {
        const node = await Node.resolve(session, abspath);

        return node.attributes.labels
        .filter((name) => name)
        .map((name) => labels.find((label) => label.name === name));
    }

    return labels;
};
