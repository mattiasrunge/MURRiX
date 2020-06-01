"use strict";

const chalk = require("chalk");
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
        term.writeln(`${chalk.bold`Username:`} ${info.uid.name}`);
        term.writeln(`${chalk.bold`UID:`} ${chalk.magenta(info.uid.id)}`);
        term.writeln(chalk.bold`Groups:`);

        const data = info.gids.map(({ name, id }) => [ name, `(${chalk.bold`GID:`} ${chalk.magenta(id)})` ]);

        term.writeTable(data, {
            columnDefault: {
                paddingLeft: 2,
                paddingRight: 0
            }
        });
    }
};
