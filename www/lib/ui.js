"use strict";

const $ = require("jquery");
const ko = require("knockout");
const utils = require("lib/utils");

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
        ko.applyBindings({}, document.body);
    }),
    windowSize: ko.pureComputed(() => {
        resizeFlag();
        return { width: $window.width(), height: $window.height() };
    }),
    setTitle: (title) => {
        document.title = title ? title : "MURRiX";
    }
};
