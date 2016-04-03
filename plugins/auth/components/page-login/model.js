"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.user = session.user;
    this.username = ko.observable();
    this.password = ko.observable();
    this.loading = status.create();
    this.loginDisallowed = ko.pureComputed(() => {
        return this.loading() || this.username() === "" || this.password() === "";
    });

    this.login = co.wrap(function*() {
        if (this.loginDisallowed()) {
            return;
        }

        this.loading(true);

        try {
            let result = yield api.auth.login(this.username(), this.password());

            this.user(result);
            status.printSuccess("Login successfull, welcome " + result.attributes.name + "!");
        } catch (e) {
            console.error(e);
            status.printError("Login failed");
        }

        this.loading(false);
    }.bind(this));

    this.logout = co.wrap(function*() {
        this.loading(true);

        try {
            yield api.auth.logout();

            this.user(false);
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
