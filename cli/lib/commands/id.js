"use strict";

const client = require("../client");

module.exports = {
    description: "Print information about user ids",
    help: "Usage: id [username]",
    execute: function*(session, params) {
        let info = yield client.call("id", {
            username: params.username || session.env("username")
        });

        let str = "uid=" + info.uid.id + "(" + info.uid.name + ") ";
        str += "gid=" + info.gid.id + "(" + info.gid.name + ") ";
        str += "groups=" + info.gids.map((group) => group.id + "(" + group.name + ")").join(",");

        session.stdout().write(str + "\n");
    }
};
