"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.user = session.user;
    this.uid = ko.pureComputed(() => {
        if (!this.user()) {
            return false;
        }

        return this.user().attributes.uid;
    });
    this.personPath = session.personPath;
    this.loggedIn = session.loggedIn;

    this.dispose = () => {
    };
});
