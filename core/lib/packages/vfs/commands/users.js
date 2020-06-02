"use strict";

const color = require("../../../lib/color");
const { api } = require("../../../api");

module.exports = async (client, term
// List users
) => {
    const users = await api.users(client);

    for (const user of users) {
        user.groups = await api.groups(client, user.name);
    }

    const data = users.map((user) => ([
        user.attributes.name,
        user.name,
        user.attributes.uid,
        user.attributes.inactive ? "No" : "Yes",
        user.attributes.loginTime ? user.attributes.loginTime.toISOString() : "Never",
        user.groups.map(({ name }) => name).join(", ")
    ]));

    term.writeTable([
        [
            color.bold`Name`,
            color.bold`Username`,
            color.bold`UID`,
            color.bold`Active`,
            color.bold`Last Login`,
            color.bold`Groups`
        ],
        ...data
    ]);
};
