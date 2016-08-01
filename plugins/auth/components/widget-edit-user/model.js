"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.name = ko.observable("");
    this.username = ko.observable("");
    this.email = ko.observable("");
    this.password1 = ko.observable("");
    this.password2 = ko.observable("");
    this.personPath = ko.observable(false);

    let subscription = params.user.subscribe(() => this.reset());

    this.reset = () => {
        this.password1("");
        this.password2("");

        this.name(params.user().attributes.name);
        this.username(params.username());
        this.email(params.user().attributes.email);
        this.personPath(params.personPath());
    };

    this.save = co.wrap(function*() {
        if (this.username() === "") {
            return stat.printError("Username can not be empty!");
        }

        this.loading(true);

        try {
            yield api.auth.saveProfile(params.username(), {
                name: this.name()
            }, this.personPath());

            if (params.username() !== this.username()) {
                yield api.auth.changeUsername(params.username(), this.username());

                if (params.username() === session.username()) {
                    stat.printInfo("After username change you must login again");
                    yield api.auth.logout();
                    yield session.loadUser();
                    loc.goto({ page: "login" });
                }
            }

            stat.printSuccess("Profile saved successfully!");
        } catch (e) {
            console.error(e);
            stat.printError("Failed to save user");
        }

        this.loading(false);
    }.bind(this));

    this.changePassword = co.wrap(function*() {
        if (this.password1() !== this.password2()) {
            return stat.printError("Password does not match!");
        } else if (this.password1() === "") {
            return stat.printError("Password can not be empty!");
        }

        this.loading(true);

        try {
            yield api.auth.passwd(params.username(), this.password1());

            stat.printSuccess("Password changed successfully!");

            this.password1("");
            this.password2("");
        } catch (e) {
            console.error(e);
            stat.printError("Failed to change password");
        }

        this.loading(false);
    }.bind(this));

    this.reset();

    this.dispose = () => {
        stat.destroy(this.loading);
        subscription.dispose();
    };
});
