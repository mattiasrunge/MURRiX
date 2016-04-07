"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.user = session.user;
    this.username = session.username;
    this.personPath = session.personPath;
    this.loggedIn = session.loggedIn;
    this.loading = status.create();
    this.groupList = ko.observableArray();

    this.groupList(yield api.auth.groupList(session.username()));

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
