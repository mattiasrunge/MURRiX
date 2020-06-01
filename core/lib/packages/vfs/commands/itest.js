"use strict";

module.exports = async (client, term
// Test interrupt
) => {
    while (!term.hasInterrupt()) {
        term.writeln("Waiting for user interrupt (ctrl + c)");
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
};
