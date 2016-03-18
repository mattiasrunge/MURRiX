"use strict";

const components = require("json!components.json");
const ko = require("knockout");
const utils = require("lib/utils");
const Bluebird = require("bluebird");
const co = Bluebird.coroutine;

module.exports = {
    start: co(function*() {
        require("lib/bindings");
        require("bootstrap");
        require("ripples");
        require("material");

        utils.registerComponents(components);

        let Model = function() {};

        ko.applyBindings(new Model(), document.body);
    })
};
