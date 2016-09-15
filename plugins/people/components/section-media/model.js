"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.nodepath = params.nodepath;
model.size = 226;

model.data = ko.asyncComputed([], function*(setter) {
    let result = {
        files: [],
        texts: []
    };

    if (!model.nodepath()) {
        return result;
    }

    setter(result);

    model.loading(true);
    result.files = yield api.people.findByTags(model.nodepath().path);
    model.loading(false);

    result.files = result.files.map((file) => {
        file.node = ko.observable(file.node);
        return file;
    });

    return result;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return {
        files: [],
        texts: []
    };
});

const dispose = () => {
    stat.destroy(model.loading);
};
