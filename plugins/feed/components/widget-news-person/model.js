"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

model.itemPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path : false);
model.item = ko.nodepath(model.itemPath, { noerror: true });

const dispose = () => {
    model.item.dispose();
};
