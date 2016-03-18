"use strict";

const columnify = require("columnify");
const moment = require("moment");
const vorpal = require("../vorpal");
const session = require("../session");
const api = require("api.io").client;
const terminal = require("../terminal");

vorpal
.command("ls [path]", "List directory")
.option("-l", "Use a long listing format")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");
    let pipedOutput = this.commandWrapper.pipes.length > 0;
    let dir = args.path || cwd;

    if (!args.options.l) {
        let list = yield api.vfs.list(terminal.normalize(cwd, dir));

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

    let items = yield api.vfs.list(terminal.normalize(cwd, dir), true);

    let ucache = {};
    let gcache = {};

    for (let item of items) {
        if (!ucache[item.node.properties.uid]) {
            ucache[item.node.properties.uid] = yield api.vfs.uname(item.node.properties.uid);
        }

        if (!gcache[item.node.properties.gid]) {
            gcache[item.node.properties.gid] = yield api.vfs.gname(item.node.properties.gid);
        }
    }

    let columns = columnify(items.map((item) => {
        let mode = terminal.modeString(item.node.properties.mode);
        let name = terminal.colorName(item.name, item.node.properties.type);
        let uid = ucache[item.node.properties.uid] ? ucache[item.node.properties.uid] : item.node.properties.uid.toString();
        let gid = gcache[item.node.properties.gid] ? gcache[item.node.properties.gid] : item.node.properties.gid.toString();

        return {
            mode: item.node.properties.type + mode,
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
