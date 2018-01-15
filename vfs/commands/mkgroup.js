"use strict";

const Node = require("../lib/Node");

module.exports = async (session, name, title, description = "") => {
    const groups = await Node.resolve(session, "/groups");

    const group = await groups.createChild(session, "g", name, {
        name: title,
        description
    });

    return group.serialize(session);
};
