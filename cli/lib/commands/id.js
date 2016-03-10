"use strict";

const vorpal = require("../vorpal");
const client = require("../client");
const session = require("../session");

vorpal
.command("id [username]", "Print information about user ids")
.action(vorpal.wrap(function*(args) {
    let info = yield client.call("id", {
        username: args.username || (yield session.env("username"))
    });

    let str = "uid=" + info.uid.id + "(" + info.uid.name + ") ";
    str += "gid=" + info.gid.id + "(" + info.gid.name + ") ";
    str += "groups=" + info.gids.map((group) => group.id + "(" + group.name + ")").join(",");

    this.log(str);
}));
