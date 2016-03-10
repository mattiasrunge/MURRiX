"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Move a node",
    help: "Usage: mv <srcpath> <destpath>",
    execute: function*(session, params) {
        yield client.call("move", {
            srcpath: path.normalize(session.env("cwd"), params.srcpath),
            destpath: path.normalize(session.env("cwd"), params.destpath)
        });
    },
    completer: path.completer
};
