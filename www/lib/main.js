"use strict";

const api = require("api.io-client");
const ui = require("lib/ui");
const utils = require("lib/utils");
const session = require("lib/session");

module.exports = {
    start: utils.co(function*(args) {
        yield api.connect(args);

        let userinfo = yield api.auth.whoami()
        session.user(userinfo.user);
        session.username(userinfo.username);

        yield ui.start();
    })
};
