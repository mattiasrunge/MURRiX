"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Set or unset a persons mother
    opts,
    person, // Person
    mother = false // Person
) => {
    await api.setparent(client, person.path, "f", mother?.path);

    if (mother) {
        term.writeln(`${chalk.bold(mother.attributes.name)} is now mother to ${chalk.bold(person.attributes.name)}`);
    } else {
        term.writeln(`${chalk.bold(person.attributes.name)} has no mother set anymore`);
    }
};
