"use strict";

const Node = require("../lib/Node");
const { ADMIN_SESSION } = require("../lib/auth");
const groups = require("./groups");

module.exports = async (session) => {
    const user = await Node.resolve(ADMIN_SESSION, "/users/guest");
    const grps = await groups(ADMIN_SESSION, "guest");

    session.username = "guest";
    session.uid = user.attributes.uid;
    session.gid = user.attributes.gid;
    session.gids = grps.map((group) => group.attributes.gid);

    return user.serialize(session);
};
