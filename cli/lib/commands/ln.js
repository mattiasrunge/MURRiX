"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Link a node",
    help: "Usage: ln <srcpath> <destpath>",
    execute: function*(session, params) {
        yield client.call("link", {
            srcpath: path.normalize(session.env("cwd"), params.srcpath),
            destpath: path.normalize(session.env("cwd"), params.destpath)
        });
    },
    completer: path.completer
};
