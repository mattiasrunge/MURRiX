"use strict";

const assert = require("assert");
const { api } = require("../../../api");
const { ADMIN_CLIENT } = require("../../../auth");

module.exports = async (client, term,
    // Change directory
    opts,
    abspath = "" // AbsolutePath
) => {
    if (abspath === client.getCurrentDirectory()) {
        return;
    }

    assert(await api.exists(ADMIN_CLIENT, abspath), `${abspath}: Path not found`);
    assert(await api.access(client, abspath, "x"), `${abspath}: Permission denied`);

    client.setCurrentDirectory(abspath);
};
