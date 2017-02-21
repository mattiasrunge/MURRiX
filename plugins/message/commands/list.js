"use strict";

const columnify = require("columnify");
const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("message list", "List messages.")
.action(vorpal.wrap(async (ctx/*, session, args*/) => {
    let list = await api.message.list();
    let ucache = {};

    list = list.reverse();

    for (let message of list) {
        if (!ucache[message.node.attributes.from]) {
            ucache[message.node.attributes.from] = await api.auth.uname(message.node.attributes.from);
        }
    }

    let columns = columnify(list.map((message) => {
        let row = {
            "Index": message.index.toString(),
            "Received At": message.node.properties.ctime,
            "From": ucache[message.node.attributes.from]
        };

        if (message.unread) {
            Object.keys(row).forEach((key) => {
                row[key] = row[key].bold;
            });
        }

        return row;
    }), {
        config: {
            "Index": { headingTransform: (heading) => heading },
            "Received At": { headingTransform: (heading) => heading },
            "From": { headingTransform: (heading) => heading }
        },
        columnSplitter: " | "
    });

    ctx.log(columns);
}));
