"use strict";

const ko = require("knockout");

model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
