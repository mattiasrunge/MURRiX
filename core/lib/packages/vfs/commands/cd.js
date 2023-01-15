"use strict";

const assert = require("assert");
const { api } = require("../../../api");
const { getAdminClient } = require("../../../auth");

module.exports = async (client, term,
    // Change directory
    opts,
    abspath = "" // AbsolutePath
) => {
    if (abspath === client.getCurrentDirectory()) {
        return;
    }

    assert(await api.exists(await getAdminClient(), abspath), `${abspath}: Path not found`);
    assert(await api.access(client, abspath, "x"), `${abspath}: Permission denied`);

    client.setCurrentDirectory(abspath);
};
