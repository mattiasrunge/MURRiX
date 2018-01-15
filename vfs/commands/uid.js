"use strict";

const assert = require("assert");
const { isGuest } = require("../lib/auth");
const users = require("./users");

module.exports = async (session, value) => {
    assert(!isGuest(session), "Permission denied");

    const usrs = await users(session);
    const id = parseInt(value, 10);

    if (isNaN(id)) {
        const user = usrs.find((user) => user.name === value);

        assert(user, `No user matching ${value} found`);

        return user.attributes.uid;
    }

    const user = usrs.find((user) => user.attributes.uid === id);

    assert(user, `No user matching ${value} found`);

    return user.name;
};
