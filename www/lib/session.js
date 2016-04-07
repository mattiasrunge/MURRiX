"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");

module.exports = {
    user: ko.observable(false),
    username: ko.observable("guest"),
    person: ko.observable(false),
    personPath: ko.observable(false),
    loggedIn: ko.pureComputed(() => {
        return module.exports.user() && module.exports.username() !== "guest";
    }),
    loadUser: co.wrap(function*() {
        let userinfo = yield api.auth.whoami();
        module.exports.user(userinfo.user);
        module.exports.username(userinfo.username);
console.log(userinfo);
        if (userinfo.person) {
            module.exports.personPath(userinfo.person.attributes.path)
            module.exports.person(yield api.vfs.resolve(module.exports.personPath()));
        }
    })
};
