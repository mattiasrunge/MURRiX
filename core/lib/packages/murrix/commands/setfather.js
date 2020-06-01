"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Set or unset a persons father
    opts,
    person, // Person
    father = false // Person
) => {
    await api.setparent(client, person.path, "m", father?.path);

    if (father) {
        term.writeln(`${chalk.bold(father.attributes.name)} is now father to ${chalk.bold(person.attributes.name)}`);
    } else {
        term.writeln(`${chalk.bold(person.attributes.name)} has no father set anymore`);
    }
};
