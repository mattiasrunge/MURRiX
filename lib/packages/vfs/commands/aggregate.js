"use strict";

const assert = require("assert");
const db = require("../../../core/db");
const { isAdmin } = require("../../../core/auth");

module.exports = async (session, pipeline) => {
    assert(isAdmin(session), "Permission denied");

    const cursor = await db.aggregate("nodes", pipeline);

    return cursor.toArray();
};
