"use strict";

const vorpal = require("../vorpal");
const api = require("api.io").client;

vorpal
.command("mkuser <username>", "Create a new user")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    yield api.vfs.mkuser(args.username, prompt.name);
}));
/*
 mkuser: (username, fullname) => {
        let p = client.call("create", {
            abspath: "/groups/" + username,
            type: "g",
            attributes: {
                name: fullname
            }
        });

        p = p.then((group) => {
            return client.call("create", {
                abspath: "/users/" + username,
                type: "u",
                attributes: {
                    gid: group.attributes.gid,
                    name: fullname
                }
            });
        });

        p = p.then(() => {
            return client.call("link", {
                srcpath: "/groups/" + username,
                destpath: "/users/" + username
            });
        });

        p = p.then(() => {
            return client.call("link", {
                srcpath: "/users/" + username,
                destpath: "/groups/" + username
            });
        });

        return p;
    }*/
