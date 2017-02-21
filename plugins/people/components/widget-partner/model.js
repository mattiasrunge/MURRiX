"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.reloadFlag = ko.observable(false);
model.personPath = ko.pureComputed({
    read: () => {
        return model.nodepath().path;
    },
    write: (path) => {
        if (!model.editing()) {
            return;
        }

        model.editing(false);

        if (path === model.nodepath().path) {
            return;
        }

        api.people.setPartner(ko.unwrap(params.nodepath().path), path)
        .then(() => {
            model.reloadFlag(!model.reloadFlag());
            console.log("Saving partner " + path + " successfull!");
        })
        .catch((error) => {
            stat.printError(error);
        });
    }
});

model.editing = ko.observable(false);
model.nodepath = ko.asyncComputed(false, async (setter) => {
    setter(false);

    model.reloadFlag();

    let nodepath = await api.people.getPartner(ko.unwrap(params.nodepath().path));

    if (!nodepath) {
        return false;
    }

    return { path: nodepath.path, node: ko.observable(nodepath.node), editable: ko.observable(nodepath.editable) };
}, (error) => {
    stat.printError(error);
    return false;
});

model.editable = ko.pureComputed(() => {
    if (!params.nodepath()) {
        return false;
    }

    return ko.unwrap(params.nodepath().editable);
});

model.edit = () => {
    model.editing(true);
};
