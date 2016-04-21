"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");

module.exports = {
    node: ko.observable(false),
    user: ko.observable(false),
    username: ko.observable("guest"),
    personPath: ko.observable(false),
    loggedIn: ko.pureComputed(() => {
        return module.exports.user() && module.exports.username() !== "guest";
    }),
    loadUser: co.wrap(function*() {
        let userinfo = yield api.auth.whoami();
        module.exports.user(userinfo.user);
        module.exports.username(userinfo.username);
        module.exports.personPath(userinfo.personPath);

        console.log(userinfo);
    }),
    searchPaths: ko.pureComputed(() => {
        if (module.exports.loggedIn()) {
            return [ "/people", "/locations", "/albums" ];
        }

        return [];
    })
};
