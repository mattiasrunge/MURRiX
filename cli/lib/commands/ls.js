"use strict";

const columnify = require("columnify");
const moment = require("moment");
const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("ls [path]", "List directory")
.option("-l", "Use a long listing format")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let pipedOutput = this.commandWrapper.pipes.length > 0;
    let dir = args.path || (yield session.env("cwd"));
    let items = yield client.call("list", {
        abspath: vfs.normalize(yield session.env("cwd"), dir),
        all: true
    });

    if (!args.options.l) {
        let list = items.filter((item) => item.name !== "." && item.name !== "..");

        if (pipedOutput) {
            list = list.map((item) => item.name);

            for (let line of list) {
                this.log(line);
            }
        } else {
            list = list.map((item) => vfs.colorName(item.name, item.node.properties.type));
            this.log(list.join("  "));
        }

        return;
    }

    let ucache = {};
    let gcache = {};

    for (let item of items) {
        if (!ucache[item.node.properties.uid]) {
            ucache[item.node.properties.uid] = yield client.call("uname", { uid: item.node.properties.uid });
        }

        if (!gcache[item.node.properties.gid]) {
            gcache[item.node.properties.gid] = yield client.call("gname", { gid: item.node.properties.gid });
        }
    }

    let columns = columnify(items.map((item) => {
        let mode = vfs.modeString(item.node.properties.mode);
        let name = vfs.colorName(item.name, item.node.properties.type);
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
