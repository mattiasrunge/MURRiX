"use strict";

const $ = require("jquery");
const ko = require("knockout");
const moment = require("moment");
const utils = require("lib/utils");
const loc = require("lib/location");

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
    init: (element/*, valueAccessor*/) => {
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).off("click");
        });
    },
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        $element.off("click");

        if (typeof value !== "string") {
            value = loc.constructUrl(value, true);
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
                loc.goto(value);
            });
        }
    }
};

ko.bindingHandlers.datetimeLocal = {
    update: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());

        if (!value) {
            $(element).text("Unknown");
            return;
        }

        let dateItem = moment.utc(value * 1000).local();

        if (!dateItem.date()) {
            $(element).html(value);
        } else {
            $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
        }
    }
};

ko.bindingHandlers.datetimeAgo = {
    update: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());
        let dateItem = null;

        if (typeof value === "number") {
            dateItem = moment.unix(value);
        } else if (typeof value === "string") {
            dateItem = moment(value + "+0000", "YYYY-MM-DD HH:mm:ss Z");
        } else {
            $(element).html("never");
            return;
        }

        if (!dateItem.date()) {
            $(element).html(ko.unwrap(value));
        } else {
            $(element).html(dateItem.fromNow());
        }
    }
};

ko.bindingHandlers.htmlSize = {
    update: function(element, valueAccessor) {
        let fileSizeInBytes = ko.unwrap(valueAccessor());
        let i = -1;
        let byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];

        do {
            fileSizeInBytes = fileSizeInBytes / 1024;
            i++;
        } while (fileSizeInBytes > 1024);

        $(element).html(fileSizeInBytes.toFixed(1) + byteUnits[i]);
    }
};
