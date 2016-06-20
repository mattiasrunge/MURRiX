"use strict";

const $ = require("jquery");
const components = require("json!components.json");
const ko = require("knockout");
const co = require("co");
const utils = require("lib/utils");
const bindings = require("lib/bindings");
const bootstrap = require("bootstrap");

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
    let computed = ko.pureComputed(() => {
        promise((value) => {
            return result(value);
        })
        .then((data) => {
            if (typeof data !== "undefined") {
                result(data);
            }
        })
        .catch((error) => {
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
}

module.exports = {
    start: utils.co(function*() {
        utils.registerComponents(components);

        let Model = function() {};

        ko.applyBindings(new Model(), document.body);
    }),
    windowSize: ko.pureComputed(() => {
        resizeFlag();
        return { width: $window.width(), height: $window.height() };
    })
};
