"use strict";

const assert = require("assert");
const { isGuest } = require("../../../core/auth");
const groups = require("./groups");

module.exports = async (session, value) => {
    assert(!isGuest(session), "Permission denied");

    const grps = await groups(session);
    const id = parseInt(value, 10);

    if (isNaN(id)) {
        const group = grps.find((group) => group.name === value);

        assert(group, `No group matching ${value} found`);

        return group.attributes.gid;
    }

    const group = grps.find((group) => group.attributes.gid === id);

    assert(group, `No group matching ${value} found`);

    return group.name;
};
