"use strict";

const mfw = require("mfw");
const db = require("./lib/db");
const vfs = require("./lib/vfs");

db.init()
.then(vfs.init)
.then(() => {
    mfw({
        name: "mfw",
        port: 8080,
        api: require("./lib/http-api"),
        routes: require("./lib/http-routes"),
        client: __dirname + "/client"
    }).start();
});
