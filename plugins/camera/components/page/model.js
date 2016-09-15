"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

model.nodepath = params.nodepath;
model.section = params.section;

model.ownersPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/owners" : false);
model.owners = ko.nodepathList(model.ownersPath, { noerror: true });

const dispose = () => {
    model.owners.dispose();
};
