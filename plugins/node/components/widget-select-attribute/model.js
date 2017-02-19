"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");

model.nodepath = params.nodepath;
model.onlyicon = ko.pureComputed(() => ko.unwrap(params.onlyicon));
model.name = ko.pureComputed(() => ko.unwrap(params.name));
model.nicename = ko.pureComputed(() => model.name().replace(/([A-Z])/g, " $1").toLowerCase());
model.options = params.options;
model.value = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return "";
    }

    return model.nodepath().node().attributes[model.name()] || "";
});
model.nicevalue = ko.pureComputed(() => {
    for (let option of ko.unwrap(model.options)) {
        if (option.name === model.value()) {
            return option.title;
        }
    }

    return model.value();
});
model.icon = ko.pureComputed(() => {
    for (let option of ko.unwrap(model.options)) {
        if (option.name === model.value()) {
            return option.icon;
        }
    }

    return false;
});
model.editable = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return false;
    }

    return ko.unwrap(model.nodepath().editable);
});

model.change = (value) => {
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
