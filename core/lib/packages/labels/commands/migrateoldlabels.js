"use strict";

const { api } = require("../../../api");

module.exports = async (client
// Toggle label on node
) => {
    await api.migrateoldlabels(client);
};
