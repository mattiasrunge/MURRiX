"use strict";

const ko = require("knockout");

model.params = params.params;
model.section = params.section;
model.sections = params.sections;
model.showShareSettings = params.showShareSettings || false;
model.showUpload = ko.pureComputed(() => ko.unwrap(params.showUpload) || false);
