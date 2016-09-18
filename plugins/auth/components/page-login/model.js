"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");
const ui = require("lib/ui");

model.user = session.user;
model.loggedIn = session.loggedIn;
model.username = ko.observable();
model.password = ko.observable();
model.loading = stat.create();
model.loginDisallowed = ko.pureComputed(() => {
    return model.loading() || model.username() === "" || model.password() === "";
});

model.login = co.wrap(function*() {
    if (model.loginDisallowed()) {
        return;
    }

    model.loading(true);

    try {
        yield api.auth.login(model.username(), model.password());
        yield session.loadUser();

        stat.printSuccess("Login successfull, welcome " + session.user().attributes.name + "!");

        model.username("");
        model.password("");

        if (loc.current().path) {
            loc.goto({ page: "node" });
        } else {
            loc.goto({ page: null }, false);
        }
    } catch (e) {
        console.error(e);
        stat.printError("Login failed");
    }

    model.loading(false);
});

model.logout = co.wrap(function*() {
    model.loading(true);

    try {
        yield api.auth.logout();
        yield session.loadUser();
        stat.printSuccess("Logout successfull");

        loc.goto({ page: "login" });
    } catch (e) {
        console.error(e);
        stat.printError("Logout failed");
    }

    model.loading(false);
});

model.reset = co.wrap(function*() {
    if (model.username() === "") {
        return stat.printError("Please enter an e-mail address to reset password");
    }

    model.loading(true);

    try {
        yield api.auth.requestReset(model.username(), document.location.origin);
        stat.printSuccess("Password reset e-mail sent!");
    } catch (e) {
        console.error(e);
        stat.printError("Failed to send password reset e-mail");
    }

    model.loading(false);
});

ui.setTitle("Login");

const dispose = () => {
    stat.destroy(model.loading);
};
