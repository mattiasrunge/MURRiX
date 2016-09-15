"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
model.width = 156;
model.height = 270;

model.fileListPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path + "/files" : false);
model.fileList = ko.nodepathList(model.fileListPath, { limit: 3, noerror: true });


model.files = ko.asyncComputed([], function*(setter) {
    if (model.fileList().length === 0) {
        return [];
    }

    setter([]);

    let ids = model.fileList().map((file) => file.node()._id);

    model.loading(true);
    let filenames = yield api.file.getMediaUrl(ids, {
        width: model.width,
        height: model.height,
        type: "image"
    });


    model.loading(false);

    let files = model.fileList().map((file) => {
        file.filename = filenames[file.node()._id] || false;
        return file;
    });

    console.log("files", files);

    return files;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
});

model.itemPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path : false);
model.item = ko.nodepath(model.itemPath, { noerror: true });

const dispose = () => {
    model.fileList.dispose();
    model.item.dispose();
    stat.destroy(model.loading);
};
