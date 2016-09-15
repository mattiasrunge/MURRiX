"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const session = require("lib/session");

model.user = session.user;
model.loggedIn = session.loggedIn;
model.page = ko.pureComputed(() => ko.unwrap(loc.current().page) || "default");
