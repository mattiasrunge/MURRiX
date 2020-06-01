"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term
// List groups
) => {
    const groups = await api.groups(client);

    for (const group of groups) {
        group.users = await api.users(client, group.name);
    }

    const data = groups.map((group) => ([
        group.name,
        group.attributes.gid,
        group.attributes.description,
        group.users.map(({ name }) => name).join(", ")
    ]));

    const { cols } = term.size();

    term.writeTable([
        [
            chalk.bold`Name`,
            chalk.bold`GID`,
            chalk.bold`Description`,
            chalk.bold`Users`
        ],
        ...data
    ], {
        columns: {
            0: {
                width: Math.floor(cols * 0.15)
            },
            1: {
                width: Math.floor(cols * 0.05)
            },
            2: {
                width: Math.floor(cols * 0.3),
                wrapWord: true
            },
            3: {
                width: Math.floor(cols * 0.45),
                wrapWord: true
            }
        }
    });
};
