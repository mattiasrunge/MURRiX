"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

model.position = ko.asyncComputed(false, async () => {
    if (!model.item()) {
        return false;
    }

    if (!model.item().node().attributes.address) {
        return false;
    }

    return await api.lookup.getPositionFromAddress(model.item().node().attributes.address.replace("<br>", "\n"));
}, (error) => {
    stat.printError(error);
    return false;
});

model.itemPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path : false);
model.item = ko.nodepath(model.itemPath, { noerror: true });

const dispose = () => {
    model.item.dispose();
    stat.destroy(model.loading);
};
