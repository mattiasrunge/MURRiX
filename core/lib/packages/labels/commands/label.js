"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Toggle label on node
    opts,
    label, // Generic
    abspath = "" // AbsolutePath
) => {
    await api.label(client, label, abspath);
};
