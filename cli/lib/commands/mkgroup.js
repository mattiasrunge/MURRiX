"use strict";

const vorpal = require("../vorpal");
const api = require("api.io").client;

vorpal
.command("mkgroup <name>", "Create a new group")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    yield api.vfs.mkgroup(args.name, prompt.name);
}));
/*
 mkgroup: (name, fullname) => {
        return client.call("create", {
            abspath: "/groups/" + name,
            type: "g",
            attributes: {
                name: fullname
            }
        });
    },*/
