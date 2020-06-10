"use strict";

const color = require("../../../lib/color");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Set or unset a persons partner
    opts,
    person, // Person
    partner = false // Person
) => {
    await api.setpartner(client, person.path, partner?.path);

    if (partner) {
        term.writeln(`${color.bold(person.attributes.name)} is now partner with ${color.bold(partner.attributes.name)}`);
    } else {
        term.writeln(`${color.bold(person.attributes.name)} has no partner now`);
    }
};
