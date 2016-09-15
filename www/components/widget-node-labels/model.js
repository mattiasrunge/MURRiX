"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.nodepath = params.nodepath;
model.editing = ko.observable(false);
model.labelString = ko.observable("");

model.edit = () => {
    model.labelString(model.nodepath().node().attributes.labels.join(" "));
    model.editing(true);
};

model.save = () => {
    let labels = model.labelString().trim();
    let oldLabels = model.nodepath().node().attributes.labels.join(" ");

    model.editing(false);

    if (labels !== oldLabels) {
        console.log("Saving attribute labels, old value was \"" + oldLabels + "\", new value is \"" + labels + "\"");

        let attributes = {};

        attributes.labels = labels.split(" ");

        api.vfs.setattributes(model.nodepath().path, attributes)
        .then((node) => {
            model.nodepath().node(node);
            console.log("Saving attribute labels successfull!", node);
        })
        .catch((error) => {
            stat.printError(error);
        });
    }
};
