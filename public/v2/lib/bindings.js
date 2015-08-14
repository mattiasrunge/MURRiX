"use strict";

define([
    "knockout",
    "jquery",
    "slider",
    "moment",
    "lib/socket"
], function(ko, $, slider, moment, socket) {
    ko.bindingHandlers.slider = {
        init: function(element, valueAccessor) {
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).slider("destroy");
            });
        },
        update: function(element, valueAccessor) {
            var options = valueAccessor();

            var s = $(element).slider({
                value: parseInt(ko.unwrap(options.value), 10),
                min: options.min ? options.min : 1800,
                max: options.max ? options.max : new Date().getFullYear(),
                step: 1,
                selection: "none",
                enabled: !ko.unwrap(options.disabled)
            });

            s.on("slideStart", function() { options.active(true); });
            s.on("slideStop", function() { options.active(false); options.value(s.slider("getValue")); });

            s.slider(ko.unwrap(options.disabled) ? "disable" : "enable");
            s.slider("setValue", parseInt(ko.unwrap(options.value), 10));
        }
    };

    ko.bindingHandlers.typeahead = {
        init: function(element, valueAccessor) {
            var options = valueAccessor();

            $(element).typeahead(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).typeahead("destroy");
            });
        },
        update: function(element, valueAccessor) {

        }
    };

    ko.bindingHandlers.datetimeAgo = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            var dateItem = null;

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

    ko.bindingHandlers.picture = {
        init: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            element.child = $("<img>");
            $(element).append(element.child);
        },
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());

            element.child.attr("src", "http://placekitten.com/g/" + ko.unwrap(value.width) + "/" + ko.unwrap(value.height));

            if (ko.unwrap(value.id)) {
                element.child.attr("src", "/preview?id=" + ko.unwrap(value.id) + "&width=" + ko.unwrap(value.width) + "&height=" + ko.unwrap(value.height) + "&square=" + ko.unwrap(value.square));
            } else if (ko.unwrap(value.nodeId)) {
                socket.emit("find", { query: { _id: ko.unwrap(value.nodeId) }, options: { collection: "nodes", limit: 1 } }, function(error, nodeDataList) {
                    if (error) {
                        notification.error(error);
                        return
                    }

                    if (nodeDataList.length === 0 || !nodeDataList[0]._profilePicture) {
                        return;
                    }

                    element.child.attr("src", "/preview?id=" + nodeDataList[0]._profilePicture + "&width=" + ko.unwrap(value.width) + "&height=" + ko.unwrap(value.height) + "&square=" + ko.unwrap(value.square));
                }.bind(this));
            }
        }
    };
});
