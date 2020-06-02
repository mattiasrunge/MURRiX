"use strict";

const color = require("../../../lib/color");
const { api } = require("../../../api");

module.exports = async (client, term
// Give admin access
) => {
    const password = await term.ask("Admin password:", true);

    await api.admin(client, password);

    term.writeln(password ? color.green`Admin rights granted` : color.bold`Admin rights recinded`);
};
