"use strict";

const ko = require("knockout");

module.exports = {
    user: ko.observable(false),
    username: ko.pureComputed(() => {
        return module.exports.user() ? module.exports.user().attributes.username : "guest"
    })
};
