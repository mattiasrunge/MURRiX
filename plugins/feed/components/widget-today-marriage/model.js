"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
