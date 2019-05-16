"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const cachemedia = require("./cachemedia");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const list = await Node.query(client, {
        "properties.type": "f",
        "attributes.type": { $in: [ "image", "video", "audio" ] },
        "attributes.cached": { $exists: false } // TODO: $or requiredSizes
    }, {
        limit: 1,
        sort: { "properties.birthtime": -1 }
    });

    if (list[0]) {
        await cachemedia(client, list[0]);

        return true;
    }

    return false;
};
