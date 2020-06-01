"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term,
    // This day in history
    opts,
    date = "" // Generic
) => {
    const events = await api.dayinhistory(client, date ? date : new Date());

    for (const event of events) {
        if (event.type === "marriage") {
            if (event.people.length === 1) {
                term.writeln(`${chalk.bold(event.people[0].attributes.name)} was married ${chalk.blueBright(event.years)} year(s) ago, ${chalk.blueBright(event.date.year)}`);
            } else {
                term.writeln(`${chalk.bold(event.people[0].attributes.name)} and ${chalk.bold(event.people[1].attributes.name)} were married ${chalk.blueBright(event.years)} year(s) ago, ${chalk.blueBright(event.date.year)}`);
            }
        } else if (event.type === "engagement") {
            if (event.people.length === 1) {
                term.writeln(`${chalk.bold(event.people[0].attributes.name)} was engaged ${chalk.blueBright(event.years)} year(s) ago, ${chalk.blueBright(event.date.year)}`);
            } else {
                term.writeln(`${chalk.bold(event.people[0].attributes.name)} and ${chalk.bold(event.people[1].attributes.name)} were engaged ${chalk.blueBright(event.years)} year(s) ago, ${chalk.blueBright(event.date.year)}`);
            }
        } else if (event.type === "birthday") {
            if (event.age.ageatdeath) {
                term.writeln(`${chalk.bold(event.person.attributes.name)} would have turned ${chalk.cyanBright(event.age.age)}, died age ${chalk.cyanBright(event.age.ageatdeath)}, born ${chalk.blueBright(event.date.year)}`);
            } else {
                term.writeln(`${chalk.bold(event.person.attributes.name)} turns ${chalk.cyanBright(event.age.age)}, born ${chalk.blueBright(event.date.year)}`);
            }
        }
    }
};
