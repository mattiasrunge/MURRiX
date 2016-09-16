"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");

module.exports = {
    list: ko.observableArray(),
    user: ko.observable(false),
    username: ko.observable("guest"),
    personPath: ko.observable(false),
    stars: ko.observableArray(),
    loggedIn: ko.pureComputed(() => {
        return module.exports.user() && module.exports.username() !== "guest";
    }),
    searchPaths: ko.pureComputed(() => {
        if (module.exports.loggedIn()) {
            return [ "/people", "/locations", "/albums", "/cameras" ];
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
