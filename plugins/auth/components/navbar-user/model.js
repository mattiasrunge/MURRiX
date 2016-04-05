"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.user = session.user;
    this.loggedIn = session.loggedIn;
    this.loading = status.create();

    this.logout = co.wrap(function*() {
        this.loading(true);

        try {
            session.user(yield api.auth.logout());
            session.username("guest");
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
