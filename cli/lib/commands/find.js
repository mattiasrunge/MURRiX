"use strict";

const client = require("../client");

module.exports = {
    description: "Find nodes",
    help: "Usage: find <search>",
    execute: function*(session, params) {
        let items = yield client.call("find", {
            abspath: session.env("cwd"),
            search: params.search
        });

        for (let item of items) {
            session.stdout().write(item + "\n");
        }
    }
};
