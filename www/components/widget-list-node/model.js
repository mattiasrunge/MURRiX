"use strict";

const utils = require("lib/utils");
const ko = require("knockout");

model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
