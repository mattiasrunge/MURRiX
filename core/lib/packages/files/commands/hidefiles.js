"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Find and hide images in album
    opts,
    abspath = "" // AbsolutePath
) => {
    const result = await api.hiderawfiles(client, abspath);

    term.write(`Found ${result.rawfiles} raw files`);
    term.write(`Found ${result.files} non-raw files`);
    term.write(`${result.hidden} raw files hidden`);
};
