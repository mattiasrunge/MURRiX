"use strict";

const moment = require("moment");
const Node = require("../lib/Node");

module.exports = async (session, year) => {
    const options = {
        fields: {
            "_id": 1
        },
        nolookup: true
    };

    const ftNodes = await Node.query(session, {
        "properties.type": { $in: [ "f", "t" ] },
        "attributes.time.timestamp": {
            $gte: moment.utc({ year }).unix(),
            $lt: moment.utc({ year: year + 1 }).unix()
        }
    }, options);
    const ftIds = ftNodes.map((node) => node._id);

    const dNodes = await Node.query(session, {
        "properties.type": "d",
        "properties.children.id": { $in: ftIds }
    }, options);
    const dIds = dNodes.map((node) => node._id);

    const nodes = await Node.query(session, {
        "properties.type": "a",
        "properties.children.id": { $in: dIds }
    });

    return Promise.all(nodes.map((node) => node.serialize(session)));
};
