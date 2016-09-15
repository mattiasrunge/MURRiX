"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");

model.path = ko.pureComputed(() => ko.unwrap(loc.current().path) || false);
model.section = ko.pureComputed(() => ko.unwrap(loc.current().section) || "default");
model.nodepath = ko.nodepath(model.path);

let subscription = model.nodepath.subscribe((nodepath) => {
    ui.setTitle(nodepath ? nodepath.node().attributes.name : false);
});

const dispose = () => {
    subscription.dispose();
    model.nodepath.dispose();
};
