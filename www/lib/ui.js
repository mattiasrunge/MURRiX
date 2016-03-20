"use strict";

const components = require("json!components.json");
const ko = require("knockout");
const utils = require("lib/utils");

module.exports = {
    start: utils.co(function*() {
        require("lib/bindings");
        require("bootstrap");
        require("ripples");
        require("material");

        utils.registerComponents(components);

        let Model = function() {};

        ko.applyBindings(new Model(), document.body);
    })
};
