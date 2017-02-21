"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");

model.user = session.user;
model.uid = ko.pureComputed(() => {
    if (!model.user()) {
        return false;
    }

    return model.user().attributes.uid;
});
model.personPath = session.personPath;
model.loggedIn = session.loggedIn;
model.loading = stat.create();

model.logout = async () => {
    model.loading(true);

    try {
        await api.auth.logout();
        await session.loadUser();
        stat.printSuccess("Logout successfull");
    } catch (e) {
        console.error(e);
        stat.printError("Logout failed");
    }

    model.loading(false);
};

const dispose = () => {
    stat.destroy(model.loading);
};
