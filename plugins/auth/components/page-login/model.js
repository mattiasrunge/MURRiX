"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");
const ui = require("lib/ui");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.user = session.user;
    this.loggedIn = session.loggedIn;
    this.username = ko.observable();
    this.password = ko.observable();
    this.loading = stat.create();
    this.loginDisallowed = ko.pureComputed(() => {
        return this.loading() || this.username() === "" || this.password() === "";
    });

    this.login = co.wrap(function*() {
        if (this.loginDisallowed()) {
            return;
        }

        this.loading(true);

        try {
            yield api.auth.login(this.username(), this.password());
            yield session.loadUser();

            stat.printSuccess("Login successfull, welcome " + session.user().attributes.name + "!");

            this.username("");
            this.password("");

            loc.goto({ page: null });
        } catch (e) {
            console.error(e);
            stat.printError("Login failed");
        }

        this.loading(false);
    }.bind(this));

    this.logout = co.wrap(function*() {
        this.loading(true);

        try {
            yield api.auth.logout();
            yield session.loadUser();
            stat.printSuccess("Logout successfull");

            loc.goto({ page: "login" });
        } catch (e) {
            console.error(e);
            stat.printError("Logout failed");
        }

        this.loading(false);
    }.bind(this));

    this.reset = co.wrap(function*() {
        if (this.username() === "") {
            return stat.printError("Please enter an e-mail address to reset password");
        }

        this.loading(true);

        try {
            yield api.auth.requestReset(this.username(), document.location.origin);
            stat.printSuccess("Password reset e-mail sent!");
        } catch (e) {
            console.error(e);
            stat.printError("Failed to send password reset e-mail");
        }

        this.loading(false);
    }.bind(this));

    ui.setTitle("Login");

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
