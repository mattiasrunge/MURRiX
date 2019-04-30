"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { isAdmin } = require("../../../core/auth");
const migrateoldtags = require("./migrateoldtags");
const ensurefilefaces = require("./ensurefilefaces");

module.exports = async (session) => {
    assert(isAdmin(session), "Permission denied");

    const list = await Node.query(session, {
        "properties.type": "f",
        "attributes.type": { $in: [ "image" ] },
        "attributes.faces": { $exists: false }
    }, {
        limit: 1,
        sort: { "properties.birthtime": -1 }
    });

    if (list[0]) {
        await migrateoldtags(session, list[0].path);
        await ensurefilefaces(session, list[0].path);

        return true;
    }

    return false;
};
