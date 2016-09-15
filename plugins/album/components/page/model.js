"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

model.nodepath = params.nodepath;
model.section = params.section;
model.filesPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/files" : false);
model.filesNodepath = ko.nodepath(model.filesPath, { noerror: true });
model.count = ko.pureComputed(() => {
    if (!model.filesNodepath()) {
        return 0;
    }

    return model.filesNodepath().node().properties.children.length;
});

const dispose = () => {
    model.filesNodepath.dispose();
};
