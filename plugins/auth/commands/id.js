"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("id [username]", "Print information about user ids")
.action(vorpal.wrap(async (ctx, session, args) => {
    let username = args.username || (await session.env("username"));

    let info = await api.auth.id(username);

    let str = "uid=" + info.uid.id + "(" + info.uid.name + ") ";
    str += "gid=" + info.gid.id + "(" + info.gid.name + ") ";
    str += "groups=" + info.gids.map((group) => group.id + "(" + group.name + ")").join(",");

    ctx.log(str);
}));
