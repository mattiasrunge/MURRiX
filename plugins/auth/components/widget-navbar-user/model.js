"use strict";

const co = require("co");
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

model.logout = co.wrap(function*() {
    model.loading(true);

    try {
        yield api.auth.logout();
        yield session.loadUser();
        stat.printSuccess("Logout successfull");
    } catch (e) {
        console.error(e);
        stat.printError("Logout failed");
    }

    model.loading(false);
});

const dispose = () => {
    stat.destroy(model.loading);
};
