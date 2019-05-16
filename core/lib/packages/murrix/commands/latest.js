"use strict";

const Node = require("../../../core/Node");
const users = require("../../vfs/commands/users");
const list = require("../../vfs/commands/list");

module.exports = async (client, limit = 50) => {
    const usrs = await users(client);
    const userlist = {};

    usrs.forEach((user) => userlist[user.attributes.uid] = user);

    const nodes = await Node.query(client, {
        "properties.type": { $in: [ "a", "l", "p" ] }
    }, {
        sort: {
            "properties.birthtime": -1
        },
        limit
    });

    const events = [];

    for (const node of nodes) {
        if (node.properties.type === "a") {
            events.push({
                type: "created",
                userpath: userlist[node.properties.birthuid] ? userlist[node.properties.birthuid].path : false,
                username: userlist[node.properties.birthuid] ? userlist[node.properties.birthuid].attributes.name : "Unknown",
                node,
                files: await list(client, `${node.path}/files`, {
                    sort: "shuffle",
                    limit: 4
                }),
                time: node.properties.birthtime
            });
        } else {
            events.push({
                type: "created",
                userpath: userlist[node.properties.birthuid] ? userlist[node.properties.birthuid].path : false,
                username: userlist[node.properties.birthuid] ? userlist[node.properties.birthuid].attributes.name : "Unknown",
                node,
                files: [],
                time: node.properties.birthtime
            });
        }
    }

    return events;
};
