"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const ui = require("lib/ui");

model.user = session.user;
model.username = session.username;
model.personPath = session.personPath;
model.loggedIn = session.loggedIn;
model.groupList = ko.observableArray();

model.groupList(yield api.auth.groupList(session.username()));

ui.setTitle("Profile");
