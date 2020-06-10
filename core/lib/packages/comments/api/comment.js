"use strict";

const path = require("path");
const assert = require("assert");
const moment = require("moment");
const { ADMIN_CLIENT } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, abspath, text) => {
    assert(await api.access(client, abspath, "r"), "Permission denied");

    const commentsPath = path.join(abspath, "comments");

    await api.ensure(ADMIN_CLIENT, commentsPath, "d");

    const newClient = client.clone({ almighty: true });

    return api.create(newClient, commentsPath, "k", moment().format(), { text });
};
