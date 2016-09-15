"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.path = ko.pureComputed(() => ko.unwrap(params.path));
model.classes = ko.pureComputed(() => ko.unwrap(params.classes));
model.size = params.size;
model.nolazyload = params.nolazyload;

model.picturePath = ko.pureComputed(() => model.path() + "/profilePicture");
model.picture = ko.nodepath(model.picturePath, { noerror: true });

model.profileUrl = ko.asyncComputed(undefined, function*(setter) {
    let id = false;

    setter(undefined);

    if (model.picture()) {
        id = model.picture().node()._id;
    } else {
        let nodepath = (yield api.vfs.list(model.path() + "/files", { noerror: true, limit: 1 }))[0];

        id = nodepath ? nodepath.node._id : false;
    }

    if (!id) {
        return false;
    }

    model.loading(true);

    let filename = yield api.file.getMediaUrl(id, {
        width: model.size,
        height: model.size,
        type: "image"
    });

    console.log("profileUrl", filename);

    model.loading(false);

    return filename;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return false;
});

const dispose = () => {
    model.picture.dispose();
    stat.destroy(model.loading);
};
