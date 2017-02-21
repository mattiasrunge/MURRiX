"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
model.size = 470;

model.filename = ko.asyncComputed(false, async (setter) => {
    if (!model.item()) {
        return false;
    }

    setter(false);

    model.loading(true);

    let filename = await api.file.getMediaUrl(model.item().node()._id, {
        width: model.size,
        type: "image"
    });

    console.log("filename", filename);

    model.loading(false);

    return filename;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return false;
});

model.itemPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path : false);
model.item = ko.nodepath(model.itemPath, { noerror: true });

const dispose = () => {
    model.item.dispose();
    stat.destroy(model.loading);
};
