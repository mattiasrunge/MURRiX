"use strict";

const assert = require("assert");
const chalk = require("chalk");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Change user password
    opts,
    username = "" // Username
) => {
    let oldPassword = null;

    assert(client.isAdmin() || username === client.getUsername(), "Only administrators are allowed to change the password of another user");

    if (!client.isAdmin()) {
        oldPassword = await term.ask("Current password:", true);
    }

    const password1 = await term.ask("New password:", true);
    const password2 = await term.ask("Confirm new password:", true);

    assert(password1 === password2, "Passwords do not match");

    await api.passwd(client, username, oldPassword, password1);

    term.writeln(chalk.green`Password updated`);
};
