"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Print file metadata
    opts,
    abspath = "" // AbsolutePath
) => {
    const metadata = await api.metadata(client, abspath);

    term.writeJson(metadata);
};
