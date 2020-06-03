"use strict";

const assert = require("assert");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Fix node problems
    opts // r Fix root;u Fix users;g Fix groups
) => {
    assert(client.isAdmin(), "Only administrators can fix things");

    try {
        if (opts.r) {
            term.write("Fixing root...");
            await api.fixroot(client);
        }

        if (opts.u) {
            term.write("Fixing users...");
            await api.fixusers(client);
        }

        if (opts.g) {
            term.write("Fixing groups...");
            await api.fixgroups(client);
        }
    } catch (error) {
        console.error(error);
        throw error;
    }

    term.write("Complete");
};
