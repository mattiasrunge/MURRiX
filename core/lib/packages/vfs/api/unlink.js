"use strict";

const path = require("path");
const { ADMIN_CLIENT } = require("../../../auth");
const Node = require("../../../lib/Node");

module.exports = async (client, abspath) => {
    let child;

    try {
        child = await Node.resolve(client, abspath, {
            nofollow: true
        });
    } catch {
        return;
    }

    const parentPath = path.dirname(abspath);
    const parent = await Node.resolve(client, parentPath);

    await parent.removeChild(client, child);
    await child.remove(client);

    // If child belongs to a group find one in that group
    // and delete it. The next delete will take the next
    // node in the group until there are no more.
    if (child.properties.group) {
        const groupNodes = await Node.query(ADMIN_CLIENT, {
            "properties.group": child.properties.group
        }, {
            limit: 1
        });

        if (groupNodes[0]) {
            await module.exports(client, groupNodes[0].path);
        }
    }
};
