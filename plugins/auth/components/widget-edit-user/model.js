"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();

//     this.personId = ko.observable(false);
    this.name = ko.observable("");
    this.username = ko.observable("");
    this.email = ko.observable("");
    this.password1 = ko.observable("");
    this.password2 = ko.observable("");
    this.person = ko.observable(false);

    ko.computed(() => {
        console.log("person", ko.unwrap(this.person));
    });

    let subscription = params.user.subscribe(() => this.reset());

    this.reset = () => {
        this.password1("");
        this.password2("");

//           this.personId(params.user()._person);
        this.name(params.user().attributes.name);
        this.username(params.username());
        this.email(params.user().attributes.email);
    };

    this.save = co.wrap(function*() {
        if (this.username() === "") {
            return status.printError("Username can not be empty!");
        }

        this.loading(true);

        try {
            yield api.auth.saveProfile(params.username(), {
                name: this.name()
            });

            if (params.username() !== this.username()) {
                yield api.auth.changeUsername(params.username(), this.username());

                if (params.username() === session.username()) {
                    session.user(yield api.auth.logout());
                    session.username("guest");
                    status.printInfo("After username change you must login again");

                    loc.goto({ page: "login" });
                }
            }

            status.printSuccess("Profile saved successfully!");
        } catch (e) {
            console.error(e);
            status.printError("Failed to save user");
        }

        this.loading(false);
    }.bind(this));

    this.changePassword = co.wrap(function*() {
        if (this.password1() !== this.password2()) {
            return status.printError("Password does not match!");
        } else if (this.password1() === "") {
            return status.printError("Password can not be empty!");
        }

        this.loading(true);

        try {
            yield api.auth.passwd(params.username(), this.password1());

            status.printSuccess("Password changed successfully!");

            this.password1("");
            this.password2("");
        } catch (e) {
            console.error(e);
            status.printError("Failed to change password");
        }

        this.loading(false);
    }.bind(this));

    this.reset();

    this.dispose = () => {
        status.destroy(this.loading);
        subscription.dispose();
    };
});
