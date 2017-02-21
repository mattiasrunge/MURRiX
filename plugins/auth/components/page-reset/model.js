"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const loc = require("lib/location");
const ui = require("lib/ui");

model.loading = stat.create();
model.password1 = ko.observable();
model.password2 = ko.observable();
model.username = ko.pureComputed(() => {
    return ko.unwrap(loc.current().email);
});
model.id = ko.pureComputed(() => {
    return ko.unwrap(loc.current().id);
});

model.changePassword = async () => {
    if (model.password1() !== model.password2()) {
        return stat.printError("Password does not match!");
    } else if (model.password1() === "") {
        return stat.printError("Password can not be empty!");
    }

    model.loading(true);

    try {
        await api.auth.passwordReset(model.username(), model.id(), model.password1());

        stat.printSuccess("Password reset successfully!");

        model.password1("");
        model.password2("");

        loc.goto({ page: "login", email: null, id: null });
    } catch (e) {
        console.error(e);
        stat.printError("Failed to reset password");
    }

    model.loading(false);
};

ui.setTitle("Password reset");

const dispose = () => {
    stat.destroy(model.loading);
};
