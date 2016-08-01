"use strict";

const $ = require("jquery");
const components = require("json!components.json");
const ko = require("knockout");
const co = require("co");
const utils = require("lib/utils");
const bindings = require("lib/bindings"); // jshint ignore:line
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

ko.asyncComputed = function(defaultValue, fn, onError, extend) {
    let promise = co.wrap(fn);
    let result = ko.observable(defaultValue);
    let active = 0;
    let computed = ko.pureComputed(() => {
        let currentActive = ++active;

        promise((value) => {
            return result(value);
        })
        .then((data) => {
            if (currentActive !== active) {
                return;
            }

            if (typeof data !== "undefined") {
                result(data);
            }
        })
        .catch((error) => {
            if (currentActive !== active) {
                return;
            }

            if (onError) {
                let ret = onError(error, result);

                if (typeof ret !== "undefined") {
                    result(ret);
                }
            } else {
                result(null);
            }
        });
    });

    if (extend) {
        computed.extend(extend);
    }

    return ko.pureComputed(() => {
        computed();
        return result();
    });
};

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
        document.title = title ? title + " | MURRiX" : "MURRiX";
    }
};
