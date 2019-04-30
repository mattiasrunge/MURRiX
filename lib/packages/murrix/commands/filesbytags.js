"use strict";

const Node = require("../../../core/Node");

module.exports = async (session, abspath) => {
    const options = {
        fields: {
            "_id": 1
        },
        nolookup: true
    };

    const sNodes = await Node.query(session, {
        "properties.type": "s",
        "attributes.path": abspath
    }, options);
    const sIds = sNodes.map((node) => node._id);

    const dNodes = await Node.query(session, {
        "properties.type": "d",
        "properties.children.id": { $in: sIds }
    }, options);
    const dIds = dNodes.map((node) => node._id);

    const nodes = await Node.query(session, {
        "properties.type": "f",
        "properties.children.id": { $in: dIds }
    });

    const serialized = await Promise.all(nodes.map((node) => node.serialize(session)));

    return serialized;
};
