"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Copy a node",
    help: "Usage: cp <srcpath> <destpath>",
    execute: function*(session, params) {
        yield client.call("copy", {
            srcpath: path.normalize(session.env("cwd"), params.srcpath),
            destpath: path.normalize(session.env("cwd"), params.destpath)
        });
    },
    completer: path.completer
};
