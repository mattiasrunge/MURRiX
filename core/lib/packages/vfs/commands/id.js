"use strict";

const color = require("../../../lib/color");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Print user and group information
    opts, // l Print in legacy format
    username = "" // Username
) => {
    const info = await api.userid(client, username);

    if (opts.l) {
        term.writeln(`uid=${info.uid.id}(${info.uid.name}) gid=${info.gid.id}(${info.gid.name}) groups=${info.gids.map((group) => `${group.id}(${group.name})`).join(",")}`);
    } else {
        term.writeln(`${color.bold`Username:`} ${info.uid.name}`);
        term.writeln(`${color.bold`UID:`} ${color.magenta(info.uid.id)}`);
        term.writeln(color.bold`Groups:`);

        const data = info.gids.map(({ name, id }) => [ name, `(${color.bold`GID:`} ${color.magenta(id)})` ]);

        term.writeTable(data, {
            columnDefault: {
                paddingLeft: 2,
                paddingRight: 0
            }
        });
    }
};
