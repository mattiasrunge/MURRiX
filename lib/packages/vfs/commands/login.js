"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_SESSION } = require("../../../core/auth");
const groups = require("./groups");

module.exports = async (session, username, password) => {
    const user = await Node.resolve(ADMIN_SESSION, `/users/${username}`);

    assert(!user.attributes.inactive, "Authentication failed");
    assert(user.attributes.password, "Authentication failed");
    assert(await user.matchPassword(password), "Authentication failed");

    const grps = await groups(ADMIN_SESSION, username);

    session.username = username;
    session.uid = user.attributes.uid;
    session.gid = user.attributes.gid;
    session.gids = grps.map((group) => group.attributes.gid);

    await user.updateLoginTime(ADMIN_SESSION);

    return user.serialize(session);
};
