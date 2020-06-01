"use strict";

const chalk = require("chalk");
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
            chalk.bold`Name`,
            chalk.bold`Username`,
            chalk.bold`UID`,
            chalk.bold`Active`,
            chalk.bold`Last Login`,
            chalk.bold`Groups`
        ],
        ...data
    ]);
};
