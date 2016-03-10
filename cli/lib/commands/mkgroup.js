"use strict";

const client = require("../client");

module.exports = {
    description: "Create a new group",
    help: "Usage: mkgroup <name>",
    execute: function*(session, params) {
        let name = yield session.ask("Name:");

        yield client.call("create", {
            abspath: "/groups/" + params.name,
            type: "g",
            attributes: {
                name: name
            }
        });
    }
};
