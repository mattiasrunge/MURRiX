"use strict";

const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.user = session.user;
    this.personPath = session.personPath;
    this.loggedIn = session.loggedIn;
    this.loading = status.create();

    this.logout = co.wrap(function*() {
        this.loading(true);

        try {
            yield api.auth.logout();
            yield session.loadUser();
            status.printSuccess("Logout successfull");
        } catch (e) {
            console.error(e);
            status.printError("Logout failed");
        }

        this.loading(false);
    }.bind(this));

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
