"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term
// Give admin access
) => {
    const password = await term.ask("Admin password:", true);

    await api.admin(client, password);

    term.writeln(password ? chalk.green`Admin rights granted` : chalk.bold`Admin rights recinded`);
};
