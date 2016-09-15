"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
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
