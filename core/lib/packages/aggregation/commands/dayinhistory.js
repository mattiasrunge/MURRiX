"use strict";

const color = require("../../../lib/color");
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
                term.writeln(`${color.bold(event.people[0].attributes.name)} was married ${color.blueBright(event.years)} year(s) ago, ${color.blueBright(event.date.year)}`);
            } else {
                term.writeln(`${color.bold(event.people[0].attributes.name)} and ${color.bold(event.people[1].attributes.name)} were married ${color.blueBright(event.years)} year(s) ago, ${color.blueBright(event.date.year)}`);
            }
        } else if (event.type === "engagement") {
            if (event.people.length === 1) {
                term.writeln(`${color.bold(event.people[0].attributes.name)} was engaged ${color.blueBright(event.years)} year(s) ago, ${color.blueBright(event.date.year)}`);
            } else {
                term.writeln(`${color.bold(event.people[0].attributes.name)} and ${color.bold(event.people[1].attributes.name)} were engaged ${color.blueBright(event.years)} year(s) ago, ${color.blueBright(event.date.year)}`);
            }
        } else if (event.type === "birthday") {
            if (event.age.ageatdeath) {
                term.writeln(`${color.bold(event.person.attributes.name)} would have turned ${color.cyanBright(event.age.age)}, died age ${color.cyanBright(event.age.ageatdeath)}, born ${color.blueBright(event.date.year)}`);
            } else {
                term.writeln(`${color.bold(event.person.attributes.name)} turns ${color.cyanBright(event.age.age)}, born ${color.blueBright(event.date.year)}`);
            }
        }
    }
};
