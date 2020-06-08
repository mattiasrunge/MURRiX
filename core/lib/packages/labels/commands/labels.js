"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // List node labels
    opts, // l List with newlines
    abspath = "" // AbsolutePath
) => {
    const labels = await api.labels(client, abspath);

    term.writeln(labels.join(opts.l ? "\n" : "  "));
};
