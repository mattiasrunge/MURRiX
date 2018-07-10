"use strict";

const assert = require("assert");
const Node = require("../lib/Node");
const { isAdmin } = require("../lib/auth");
const cachemedia = require("./cachemedia");

module.exports = async (session) => {
    assert(isAdmin(session), "Permission denied");

    const list = await Node.query(session, {
        "properties.type": "f",
        "attributes.type": { $in: [ "image", "video", "audio" ] },
        "attributes.cached": { $exists: false } // TODO: $or requiredSizes
    }, {
        limit: 1,
        sort: { "properties.birthtime": -1 }
    });

    if (list[0]) {
        await cachemedia(session, list[0]);

        return true;
    }

    return false;
};
