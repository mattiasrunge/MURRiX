"use strict";

const path = require("path");
const assert = require("assert");
const moment = require("moment");
const Node = require("../../../core/Node");
const auth = require("../../../core/auth");
const age = require("./age");

module.exports = async (session, datestr) => {
    assert(!auth.isGuest(session), "Permission denied");

    const date = moment(datestr);

    assert(date.isValid(), "Date string was not a valid date");

    const pipeline = [
        {
            $match: {
                "properties.type": "t",
                "attributes.type": { $in: [ "birth", "marriage", "engagement" ] },
                "attributes.time.timestamp": { $ne: null },
                "attributes.time.accuracy": { $in: [ "second", "minute", "hour", "day" ] }
            }
        },
        {
            $project: {
                date: {
                    $add: [
                        new Date(0),
                        { $multiply: [ "$attributes.time.timestamp", 1000 ] }
                    ]
                }
            }
        },
        {
            $project: {
                day: { $dayOfMonth: "$date" },
                month: { $month: "$date" },
                year: { $year: "$date" }
            }
        },
        {
            $match: {
                day: date.date(),
                month: date.month() + 1
            }
        }
    ];

    const cursor = await Node.aggregate(session, pipeline);
    const data = await cursor.toArray();
    const events = [];

    for (const item of data) {
        const nodes = await Node.lookup(session, item._id);

        if (nodes.length === 0) {
            continue;
        }

        const node = nodes[0];
        const people = await Promise.all(nodes
        .map((node) => path.resolve(path.join(node.path, "..", "..")))
        .map((path) => Node.resolve(session, path)));

        if (people.length === 0) {
            continue;
        }

        if (node.attributes.type === "marriage") {
            events.push(({
                type: "marriage",
                node,
                people,
                date: {
                    year: item.year,
                    month: item.month,
                    day: item.day
                },
                years: date.year() - item.year
            }));
        } else if (node.attributes.type === "engagement") {
            events.push(({
                type: "engagement",
                node,
                people,
                date: {
                    year: item.year,
                    month: item.month,
                    day: item.day
                },
                years: date.year() - item.year
            }));
        } else if (node.attributes.type === "birth") {
            events.push(({
                type: "birthday",
                node,
                person: people[0],
                date: {
                    year: item.year,
                    month: item.month,
                    day: item.day
                },
                age: await age(session, people[0].path)
            }));
        }
    }

    return events;
};
