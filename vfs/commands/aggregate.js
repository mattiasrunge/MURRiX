"use strict";

const assert = require("assert");
const db = require("../../core/lib/db");
const { isAdmin } = require("../lib/auth");

module.exports = async (session, pipeline) => {
    assert(isAdmin(session), "Permission denied");

    const cursor = await db.aggregate("nodes", pipeline);

    return cursor.toArray();
};
