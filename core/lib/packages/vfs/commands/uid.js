"use strict";

const assert = require("assert");
const users = require("./users");

module.exports = async (client, value) => {
    assert(!client.isGuest(), "Permission denied");

    const usrs = await users(client);
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
