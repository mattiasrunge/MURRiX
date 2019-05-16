
import { cmd } from "lib/backend";

export default {
    desc: "This day in history",
    args: [ "?date" ],
    exec: async (term, streams, command, opts, args) => {
        const events = await cmd.dayinhistory(args.date);

        for (const event of events) {
            if (event.type === "marriage") {
                if (event.people.length === 1) {
                    await streams.stdout.write(`${event.people[0].attributes.name} was married ${event.years} year(s) ago, ${event.date.year}\n`);
                } else {
                    await streams.stdout.write(`${event.people[0].attributes.name} and ${event.people[1].attributes.name} were married ${event.years} year(s) ago, ${event.date.year}\n`);
                }
            } else if (event.type === "engagement") {
                if (event.people.length === 1) {
                    await streams.stdout.write(`${event.people[0].attributes.name} was engaged ${event.years} year(s) ago, ${event.date.year}\n`);
                } else {
                    await streams.stdout.write(`${event.people[0].attributes.name} and ${event.people[1].attributes.name} were engaged ${event.years} year(s) ago, ${event.date.year}\n`);
                }
            } else if (event.type === "birthday") {
                if (event.age.ageatdeath) {
                    await streams.stdout.write(`${event.person.attributes.name} would have turned ${event.age.age}, died age ${event.age.ageatdeath}, born ${event.date.year}\n`);
                } else {
                    await streams.stdout.write(`${event.person.attributes.name} turns ${event.age.age}, born ${event.date.year}\n`);
                }
            }
        }
    }
};
