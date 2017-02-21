"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

model.loading = stat.create();
model.name = ko.observable("");
model.username = ko.observable("");
model.email = ko.observable("");
model.password1 = ko.observable("");
model.password2 = ko.observable("");
model.personPath = ko.observable(false);

let subscription = params.user.subscribe(() => model.reset());

model.reset = () => {
    model.password1("");
    model.password2("");

    model.name(params.user().attributes.name);
    model.username(params.username());
    model.email(params.user().attributes.email);
    model.personPath(params.personPath());
};

model.save = async () => {
    if (model.username() === "") {
        return stat.printError("Username can not be empty!");
    }

    model.loading(true);

    try {
        await api.auth.saveProfile(params.username(), {
            name: model.name()
        }, model.personPath());

        if (params.username() !== model.username()) {
            await api.auth.changeUsername(params.username(), model.username());

            if (params.username() === session.username()) {
                stat.printInfo("After username change you must login again");
                await api.auth.logout();
                await session.loadUser();
                loc.goto({ page: "login" });
            }
        }

        stat.printSuccess("Profile saved successfully!");
    } catch (e) {
        console.error(e);
        stat.printError("Failed to save user");
    }

    model.loading(false);
};

model.changePassword = async () => {
    if (model.password1() !== model.password2()) {
        return stat.printError("Password does not match!");
    } else if (model.password1() === "") {
        return stat.printError("Password can not be empty!");
    }

    model.loading(true);

    try {
        await api.auth.passwd(params.username(), model.password1());

        stat.printSuccess("Password changed successfully!");

        model.password1("");
        model.password2("");
    } catch (e) {
        console.error(e);
        stat.printError("Failed to change password");
    }

    model.loading(false);
};

model.reset();

const dispose = () => {
    stat.destroy(model.loading);
    subscription.dispose();
};
