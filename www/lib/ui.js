"use strict";

const $ = require("jquery");
const components = require("json!components.json");
const ko = require("knockout");
const utils = require("lib/utils");
const bindings = require("lib/bindings");
const bootstrap = require("bootstrap");

module.exports = {
    start: utils.co(function*() {
        utils.registerComponents(components);

        let Model = function() {};

        ko.applyBindings(new Model(), document.body);
    })
};
