"use strict";

const path = require("path");
const assert = require("assert");
const moment = require("moment");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, abspath, text) => {
    assert(await api.access(client, abspath, "r"), "Permission denied");

    const commentsPath = path.join(abspath, "comments");

    await api.ensure(await getAdminClient(), commentsPath, "d");

    const newClient = await client.clone({ almighty: true });

    try {
        return api.create(newClient, commentsPath, "k", moment().format(), { text });
    } finally {
        await newClient.destroy();
    }
};
