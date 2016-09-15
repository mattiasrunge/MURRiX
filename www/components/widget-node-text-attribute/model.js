"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.nodepath = params.nodepath;
model.name = ko.pureComputed(() => ko.unwrap(params.name));
model.nicename = ko.pureComputed(() => model.name().replace(/([A-Z])/g, " $1").toLowerCase());
model.value = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return "";
    }

    return model.nodepath().node().attributes[model.name()];
});
model.editable = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return false;
    }

    return ko.unwrap(model.nodepath().editable);
});

model.change = (model, event) => {
    let value = event.target.innerText.replace(/(^\n|\n$)/g, "");

    if (ko.unwrap(params.html)) {
        value = event.target.innerHTML.replace(/(^<br>|<br>$)/g, "");
    }

    if (!model.editable() || model.value() === value) {
        return;
    }

    console.log("Saving attribute " + model.name() + ", old value was \"" + model.value() + "\", new value is \"" + value + "\"");

    let attributes = {};

    attributes[model.name()] = value;

    api.vfs.setattributes(model.nodepath().path, attributes)
    .then((node) => {
        model.nodepath().node(node);
        console.log("Saving attribute " + model.name() + " successfull!", node);
    })
    .catch((error) => {
        stat.printError(error);
    });
};
