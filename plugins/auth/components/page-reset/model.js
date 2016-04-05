"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.password1 = ko.observable();
    this.password2 = ko.observable();
    this.username = ko.pureComputed(() => {
        return ko.unwrap(loc.current().email);
    });
    this.id = ko.pureComputed(() => {
        return ko.unwrap(loc.current().id);
    });

    this.changePassword = co.wrap(function*() {
        if (this.password1() !== this.password2()) {
            return status.printError("Password does not match!");
        } else if (this.password1() === "") {
            return status.printError("Password can not be empty!");
        }

        this.loading(true);

        try {
            yield api.auth.passwordReset(this.username(), this.id(), this.password1());

            status.printSuccess("Password reset successfully!");

            this.password1("");
            this.password2("");

            loc.goto({ page: "login", email: null, id: null });
        } catch (e) {
            console.error(e);
            status.printError("Failed to reset password");
        }

        this.loading(false);
    }.bind(this));

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
