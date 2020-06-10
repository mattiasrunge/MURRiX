"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, abspath) => {
    const options = {
        projection: {
            "_id": 1
        },
        nolookup: true
    };

    const sNodes = await Node.query(client, {
        "properties.type": "s",
        "attributes.path": abspath
    }, options);
    const sIds = sNodes.map((node) => node._id);

    const dNodes = await Node.query(client, {
        "properties.type": "d",
        "properties.children.id": { $in: sIds }
    }, options);
    const dIds = dNodes.map((node) => node._id);

    const nodes = await Node.query(client, {
        "properties.type": "f",
        "properties.children.id": { $in: dIds }
    });

    return await Promise.all(nodes.map((node) => node.serialize(client)));
};
