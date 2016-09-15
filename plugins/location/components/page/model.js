"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.nodepath = params.nodepath;
model.section = params.section;

model.position = ko.asyncComputed(false, function*() {
    if (!model.nodepath()) {
        return false;
    }

    if (!model.nodepath().node().attributes.address) {
        return false;
    }

    return yield api.lookup.getPositionFromAddress(model.nodepath().node().attributes.address.replace("<br>", "\n"));
}, (error) => {
    stat.printError(error);
    return false;
});

model.residentsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/residents" : false);
model.residents = ko.nodepathList(model.residentsPath, { noerror: true });

const dispose = () => {
    model.residents.dispose();
};
