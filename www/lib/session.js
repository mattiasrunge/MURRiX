"use strict";

const ko = require("knockout");

module.exports = {
    user: ko.observable(false),
    username: ko.observable("guest"),
    loggedIn: ko.pureComputed(() => {
        return module.exports.user() && module.exports.username() !== "guest";
    })
};
