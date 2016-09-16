"use strict";

const $ = require("jquery");
const ko = require("knockout");
const co = require("co");

let $window = $(window);
let resizeFlag = ko.observable(false);
let clipBoardContent = false;

$window.on("resize", () => {
    resizeFlag(!resizeFlag());
});

document.addEventListener("copy", (e) => {
    if (clipBoardContent) {
        e.clipboardData.setData("text/plain", clipBoardContent);
        e.preventDefault();
        clipBoardContent = false;
    }
});

module.exports = {
    start: co.wrap(function*() {
        ko.applyBindings({}, document.body);
    }),
    copyToClipboard: (content) => {
        clipBoardContent = content;
        document.execCommand("copy");
    },
    windowSize: ko.pureComputed(() => {
        resizeFlag();
        return { width: $window.width(), height: $window.height() };
    }).extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } }),
    setTitle: (title) => {
        document.title = title ? title : "MURRiX";
    }
};
