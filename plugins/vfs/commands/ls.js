"use strict";

const columnify = require("columnify");
const moment = require("moment");
const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("ls [path]", "List directory")
.option("-l", "Use a long listing format")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let pipedOutput = this.commandWrapper.pipes.length > 0;
    let dir = args.path || cwd;

    if (!args.options.l) {
        let list = yield api.vfs.list(terminal.normalize(cwd, dir), { nofollow: true });

        if (pipedOutput) {
            list = list.map((item) => item.name);

            for (let line of list) {
                this.log(line);
            }
        } else {
            list = list.map((item) => terminal.colorName(item.name, item.node.properties.type));
            this.log(list.join("  "));
        }

        return;
    }

    let items = yield api.vfs.list(terminal.normalize(cwd, dir), { all: true, nofollow: true });

    let ucache = {};
    let gcache = {};

    for (let item of items) {
        if (!ucache[item.node.properties.uid]) {
            ucache[item.node.properties.uid] = yield api.auth.uname(item.node.properties.uid);
        }

        if (!gcache[item.node.properties.gid]) {
            gcache[item.node.properties.gid] = yield api.auth.gname(item.node.properties.gid);
        }
    }

    let columns = columnify(items.map((item) => {
        let name = terminal.colorName(item.name, item.node.properties.type);

        if (item.node.properties.type === "s") {
            name += " -> " + item.node.attributes.path;
        }

        let mode = terminal.modeString(item.node.properties.mode);
        let acl = item.node.properties.acl && item.node.properties.acl.length > 0 ? "+" : "";
        let uid = ucache[item.node.properties.uid] ? ucache[item.node.properties.uid] : item.node.properties.uid.toString();
        let gid = gcache[item.node.properties.gid] ? gcache[item.node.properties.gid] : item.node.properties.gid.toString();

        return {
            mode: item.node.properties.type + mode + acl,
            count: item.node.properties.count,
            uid: uid.cyan,
            gid: gid.cyan,
            children: Object.keys(item.node.properties.children).length,
            mtime: moment(item.node.properties.mtime).format(),
            name: name.bold
        };
    }), {
        showHeaders: false
    });

    this.log(columns);
}));
