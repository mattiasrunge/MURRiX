"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.nodepath = params.nodepath;
model.size = 226;

model.filesPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/files" : false);
model.files = ko.nodepathList(model.filesPath, { noerror: true });

model.textsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/texts" : false);
model.texts = ko.nodepathList(model.textsPath, { noerror: true });

model.data = ko.pureComputed(() => {
    let files = model.files();
    let texts = model.texts();

    return {
        files: model.files.hasLoaded() ? files : [],
        texts: model.texts.hasLoaded() ? texts : []
    };
});

const dispose = () => {
    model.files.dispose();
    model.texts.dispose();
    stat.destroy(model.loading);
};
