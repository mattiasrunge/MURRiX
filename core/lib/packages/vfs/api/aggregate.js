"use strict";

const assert = require("assert");
const db = require("../../../lib/db");

module.exports = async (client, pipeline) => {
    assert(client.isAdmin(), "Permission denied");

    const cursor = await db.aggregate("nodes", pipeline);

    return cursor.toArray();
};
