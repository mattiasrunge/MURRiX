"use strict";

const co = require("co");
const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.user = session.user;
    this.uid = ko.pureComputed(() => {
        if (!this.user()) {
            return false;
        }

        return this.user().attributes.uid;
    });
    this.personPath = session.personPath;
    this.loggedIn = session.loggedIn;
    this.loading = stat.create();

    this.logout = co.wrap(function*() {
        this.loading(true);

        try {
            yield api.auth.logout();
            yield session.loadUser();
            stat.printSuccess("Logout successfull");
        } catch (e) {
            console.error(e);
            stat.printError("Logout failed");
        }

        this.loading(false);
    }.bind(this));

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
