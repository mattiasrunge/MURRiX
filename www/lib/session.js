"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const loc = require("lib/location");

module.exports = {
    node: ko.observable(false),
    path: ko.pureComputed(() => ko.unwrap(loc.current().path)),
    user: ko.observable(false),
    username: ko.observable("guest"),
    personPath: ko.observable(false),
    stars: ko.observableArray(),
    loggedIn: ko.pureComputed(() => {
        return module.exports.user() && module.exports.username() !== "guest";
    }),
    searchPaths: ko.pureComputed(() => {
        if (module.exports.loggedIn()) {
            return [ "/people", "/locations", "/albums" ];
        }

        return [];
    }),
    loadUser: co.wrap(function*() {
        let userinfo = yield api.auth.whoami();
        module.exports.user(userinfo.user);
        module.exports.username(userinfo.username);
        module.exports.personPath(userinfo.personPath);
        module.exports.stars(userinfo.stars || []);

        console.log(userinfo);
    })
};
