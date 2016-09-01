"use strict";

const $ = require("jquery");
const components = require("json!components.json");
const ko = require("knockout");
const utils = require("lib/utils");

const bootstrap = require("bootstrap"); // jshint ignore:line

let $window = $(window);
let resizeFlag = ko.observable(false);
let resizeTimer = null;

$window.on("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        resizeFlag(!resizeFlag());
    }, 250);
});

module.exports = {
    start: utils.co(function*() {
        utils.registerComponents(components);

        let Model = function() {};

        ko.applyBindings(new Model(), document.body);
    }),
    windowSize: ko.pureComputed(() => {
        resizeFlag();
        return { width: $window.width(), height: $window.height() };
    }),
    setTitle: (title) => {
        document.title = title ? title : "MURRiX";
    }
};
