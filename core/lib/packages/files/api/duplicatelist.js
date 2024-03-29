"use strict";

const path = require("path");
const Node = require("../../../lib/Node");

module.exports = async (client, abspath) => {
    const filespath = `${abspath}/files`;
    const nodes = await Node.list(client, filespath, {
        nofollow: true,
        query: {
            "attributes.sha1": { $exists: true }
        }
    });

    nodes.sort((a, b) => a.properties.birthtime - b.properties.birthtime);

    const duplicatesInSameFolder = {};

    for (const node of nodes) {
        // Check if this file is already a duplicate of a previously
        // processed file, if so disregard it
        if (duplicatesInSameFolder[node._id]) {
            continue;
        }

        // Find duplicates
        const duplicates = await Node.query(client, {
            "attributes.sha1": node.attributes.sha1,
            _id: { $ne: node._id }
        });

        let duplicatesInTheSameFolder = 0;

        // Find duplicates in other places
        for (const duplicate of duplicates) {
            const parentPath = path.dirname(duplicate.path);

            if (filespath !== parentPath) {
                duplicatesInSameFolder[node._id] = node;
                break;
            } else {
                duplicatesInSameFolder[duplicate._id] = duplicate;
                duplicatesInTheSameFolder++;
            }
        }

        if (duplicates.length > 0 && duplicatesInTheSameFolder === 0) {
            duplicatesInSameFolder[node._id] = node;
        }
    }

    return Object.values(duplicatesInSameFolder);
};
