"use strict";

define([
    "knockout",
    "jquery"
], function(ko, $) {
    var Me = function() {
        var lastString = false; // Last JSON version of current to compare with
        this.current = ko.observable({}); // Current parameters

        this.parseUrl = function(str) {
            if (typeof str !== "string") {
                return {};
            }

            str = str.trim().replace(/^\?/, "");

            if (!str) {
                return {};
            }

            if (str[0] === "#") {
                str = str.substr(1);
            }

            return str.trim().split("&").reduce(function(ret, param) {
                var parts = param.replace(/\+/g, " ").split("=");
                ret[parts[0]] = parts[1] === undefined ? null : decodeURIComponent(parts[1]);
                return ret;
            }, {});
        };

        this.makeUrl = function(obj) {
            return "#" + (obj ? Object.keys(obj).map(function(key) {
                return encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]);
            }).join("&") : "");
        };

        this.constructUrl = function(args, baseOnCurrent) {
            var newArgs = baseOnCurrent ? JSON.parse(JSON.stringify(this.current())) : {};

            for (var argName in args) {
                if (args.hasOwnProperty(argName)) {
                    if (ko.unwrap(args[argName]) !== "" || ko.unwrap(args[argName]) !== null) {
                        newArgs[argName] = ko.unwrap(args[argName]);
                    }

                    if (newArgs[argName] === "" || newArgs[argName] === null) {
                        delete newArgs[argName];
                    }
                }
            }

            return this.makeUrl(newArgs);
        }.bind(this);

        this.goto = function(url) {
            if (typeof url !== "string") {
                url = this.constructUrl(url, true);
            } else if (url[0] !== "#" && url.indexOf("http") !== 0 && url.indexOf("mailto") !== 0) {
                url = "#" + url;
            }

            document.location.hash = url;
        };

        var updateCurrent = function() {
            var args = this.parseUrl(document.location.hash);

            args.page = args.page || false;

            var argsString = JSON.stringify(args);

            if (lastString !== argsString) {
                this.current(args);
            }
        }.bind(this);

        $(window).on("hashchange", updateCurrent);
        updateCurrent();
    };

    var me = new Me();

    ko.bindingHandlers.location = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            var $element = $(element);

            $element.off("click");

            if (typeof value !== "string") {
                value = me.constructUrl(value, true);
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
                    me.goto(value);
                });
            }
        }
    };

    return me;
});
