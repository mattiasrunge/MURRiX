"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Create a new user",
    help: "Usage: mkuser <username>",
    execute: function*(session, params) {
        let name = yield session.ask("Name:");

        let group = yield client.call("create", {
            abspath: "/groups/" + params.username,
            type: "g",
            attributes: {
                name: name
            }
        });

        yield client.call("create", {
            abspath: "/users/" + params.username,
            type: "u",
            attributes: {
                gid: group.attributes.gid,
                name: name
            }
        });

        yield client.call("link", {
            srcpath: "/groups/" + params.username,
            destpath: "/users/" + params.username
        });

        yield client.call("link", {
            srcpath: "/users/" + params.username,
            destpath: "/groups/" + params.username
        });
    }
};
