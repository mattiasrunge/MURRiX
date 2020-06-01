"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Set or unset a persons partner
    opts,
    person, // Person
    partner = false // Person
) => {
    await api.setpartner(client, person.path, partner?.path);

    if (partner) {
        term.writeln(`${chalk.bold(person.attributes.name)} is now partner with ${chalk.bold(partner.attributes.name)}`);
    } else {
        term.writeln(`${chalk.bold(person.attributes.name)} has no partner now`);
    }
};
