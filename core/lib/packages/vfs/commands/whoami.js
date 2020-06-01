"use strict";

module.exports = async (client, term
// Shows current username
) => {
    term.writeln(client.getUsername());
};
