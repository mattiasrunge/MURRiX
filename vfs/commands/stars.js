"use strict";

const assert = require("assert");
const { ADMIN_SESSION, isGuest } = require("../lib/auth");
const Node = require("../lib/Node");

module.exports = async (session) => {
    assert(!isGuest(session), "Permission denied");

    const abspath = `/users/${session.username}/stars`;
    const list = await Node.list(ADMIN_SESSION, abspath);

    return Promise.all(list.map((nodepath) => nodepath.serialize(session)));
};
