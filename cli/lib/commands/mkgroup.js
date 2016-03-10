"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Create a new group",
    help: "Usage: mkgroup <name>",
    execute: function*(session, params) {
        let name = yield session.ask("Name:");

        let group = yield client.call("create", {
            abspath: "/groups/" + params.name,
            type: "g",
            attributes: {
                name: name
            }
        });
    }
};
