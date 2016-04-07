"use strict";

const $ = require("jquery");
const ko = require("knockout");
const co = require("co");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const loc = require("lib/location");
const typeahead = require("typeahead");

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
        let byteUnits = [ " kB", " MB", " GB", " TB", "PB", "EB", "ZB", "YB" ];

        do {
            fileSizeInBytes = fileSizeInBytes / 1024;
            i++;
        } while (fileSizeInBytes > 1024);

        $(element).html(fileSizeInBytes.toFixed(1) + byteUnits[i]);
    }
};

let lookup = co.wrap(function*(querystr) {
    let list = yield api.vfs.list("/people", false, {
        "properties.type": "p",
        "attributes.name": { $regex: ".*" + querystr + ".*", $options: "-i" }
    });

    return list.map((item) => {
        return {
            path: "/people/" + item.name,
            node: item.node
        };
    });
});

ko.bindingHandlers.typeahead = {
    init: (element, valueAccessor) => {
        let $element = $(element);
        let loading = status.create();
        let limit = 10;

        $element.typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            display: (selection) => selection.node.attributes.name,
            source: (querystr, dummy, resolve) => {
                lookup(querystr)
                .then(resolve)
                .catch((error) => {
                    status.printError(error);
                    resolve([]);
                });
            },
            limit: limit
        });

        $element.on("typeahead:active", () => { $element.removeClass("typeahead-valid"); });
        $element.on("typeahead:idle", () => {
            if (valueAccessor()()) {
                $element.addClass("typeahead-valid");
            }
        });
        $element.on("typeahead:change", () => {
            lookup($element.typeahead("val"))
            .then((list) => {
                if (list.length === 1) {
                    valueAccessor()(list[0].path);
                    $element.addClass("typeahead-valid");
                } else {
                    valueAccessor()(false);
                    $element.removeClass("typeahead-valid");
                }
            })
            .catch((error) => {
                status.printError(error);
                valueAccessor()(false);
            });
        });

        $element.on("typeahead:asyncrequest", () => loading(true));
        $element.on("typeahead:asynccancel", () => loading(false));
        $element.on("typeahead:asyncreceive", () => loading(false));

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.typeahead("destroy");
            status.destroy(loading);
        });
    },
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        if (value) {
            api.vfs.resolve(value)
            .then((node) => {
                if (node) {
                    valueAccessor()(value);
                    $element.addClass("typeahead-valid");
                    $element.typeahead("val", node.attributes.name);
                } else {
                    valueAccessor()(false);
                    $element.removeClass("typeahead-valid");
                    $element.typeahead("val", "");
                }
            })
            .catch((error) => {
                status.printError(error);
                valueAccessor()(false);
            });
        }
    }
};
