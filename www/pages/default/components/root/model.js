"use strict";

const ko = require("knockout");
const loc = require("lib/location");
const session = require("lib/session");
const stat = require("lib/status");

model.loading = stat.loading;
model.loggedIn = session.loggedIn;
model.page = ko.pureComputed(() => ko.unwrap(loc.current().page) || "default");
model.showPath = ko.pureComputed(() => ko.unwrap(loc.current().showPath));
model.list = session.list;
