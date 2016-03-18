"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const location = require("lib/location");

ko.bindingHandlers.copyToClipboard = {
    init: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        $(element).on("click", () => {
            utils.copyToClipboard(value);
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).off("click");
        });
    }
};

ko.bindingHandlers.location = {
    init: (element, valueAccessor) => {
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).off("click");
        });
    },
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        $element.off("click");

        if (typeof value !== "string") {
            value = location.constructUrl(value, true);
        } else if (value[0] !== "#" && value.indexOf("http") !== 0 && value.indexOf("mailto") !== 0) {
            value = "#" + value;
        }

        if ($element.prop("tagName").toLowerCase() === "a") {
            $element.attr("href", value);
        } else if ($element.prop("tagName").toLowerCase() === "iframe") {
            $element.attr("src", value);
            $element.get(0).contentWindow.location = value;
        } else {
            $element.on("click", function(event) {
                event.preventDefault();
                location.goto(value);
            });
        }
    }
};
