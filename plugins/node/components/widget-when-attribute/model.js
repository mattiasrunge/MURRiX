"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const chron = require("chron");
const stat = require("lib/status");

model.nodepath = params.nodepath;
model.editable = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return false;
    }

    return ko.unwrap(model.nodepath().editable);
});

model.value = ko.pureComputed({
    read: () => {
        if (!model.nodepath()) {
            return false;
        }

        return model.nodepath().node().attributes.when ? model.nodepath().node().attributes.when.manual : false;
    },
    write: (value) => {
        model.change(value);
    }
});

model.change = (value) => {
    if (!model.editable() || chron.time2str(model.value() || {}) === chron.time2str(value || {})) {
        return;
    }

    console.log("Saving attribute when, old value was \"" + JSON.stringify(model.value()) + "\", new value is \"" + JSON.stringify(value) + "\"");

    let when = model.nodepath().node().attributes.when || {};

    when.manual = value;

    api.vfs.setattributes(model.nodepath().path, { when: when })
    .then((node) => {
        // TODO: Do model serverside based on events
        if (node.properties.type === "f") {
            return api.file.regenerate(model.nodepath().path);
        }

        return node;
    })
    .then((node) => {
        model.nodepath().node(node);
        console.log("Saving attribute when successfull!", node);
    })
    .catch((error) => {
        stat.printError(error);
    });
};