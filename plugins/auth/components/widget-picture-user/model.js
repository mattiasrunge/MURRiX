"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.uid = ko.pureComputed(() => ko.unwrap(params.uid) || false);
model.size = params.size;
model.classes = ko.pureComputed(() => ko.unwrap(params.classes) || "");

model.filename = ko.asyncComputed(false, function*(setter) {
    if (!model.uid()) {
        return false;
    }

    let filename = false;

    setter(false);

    model.loading(true);

    let id = yield api.auth.picture(model.uid());

    if (id) {
        filename = yield api.file.getMediaUrl(id, {
            width: model.size,
            height: model.size,
            type: "image"
        });
    }

    model.loading(false);

    return filename;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return false;
});

const dispose = () => {
    stat.destroy(model.loading);
};
