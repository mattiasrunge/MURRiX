"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Set node attribute",
    help: "Usage: setattrib <name> <value> [path]",
    execute: function*(session, params) {
        let dir = params.path || session.env("cwd");
        let query = {
            abspath: path.normalize(session.env("cwd"), dir),
            attributes: {}
        };

        query.attributes[params.name] = params.value;

        yield client.call("setattributes", query);
    }
};
