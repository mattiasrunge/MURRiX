"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/location"
], function(template, ko, location) {
    return {
        template: template,
        viewModel: function(params) {
            this.type = ko.pureComputed(function() {
                return location.query().type;
            });

            this.types = ko.observableArray([
                {
                    type: "all",
                    suffix: " results",
                    icon: false,
                    list: params.list,
                    active: ko.pureComputed(function() {
                        return !ko.unwrap(params.type) || ko.unwrap(params.type) === "all";
                    })
                },
                {
                    type: "album",
                    suffix: " albums",
                    icon: "fa-book",
                    list: ko.pureComputed(function() {
                        return params.list().filter(function(element) {
                            return element.type === "album";
                        });
                    }),
                    active: ko.pureComputed(function() {
                        return ko.unwrap(params.type) === "album";
                    })
                },
                {
                    type: "person",
                    suffix: " persons",
                    icon: "fa-user",
                    list: ko.pureComputed(function() {
                        return params.list().filter(function(element) {
                            return element.type === "person";
                        });
                    }),
                    active: ko.pureComputed(function() {
                        return ko.unwrap(params.type) === "person";
                    })
                },
                {
                    type: "location",
                    suffix: " locations",
                    icon: "fa-map-marker",
                    list: ko.pureComputed(function() {
                        return params.list().filter(function(element) {
                            return element.type === "location";
                        });
                    }),
                    active: ko.pureComputed(function() {
                        return ko.unwrap(params.type) === "location";
                    })
                },
                {
                    type: "camera",
                    suffix: " cameras",
                    icon: "fa-camera-retro",
                    list: ko.pureComputed(function() {
                        return params.list().filter(function(element) {
                            return element.type === "camera";
                        });
                    }),
                    active: ko.pureComputed(function() {
                        return ko.unwrap(params.type) === "camera";
                    })
                },
                {
                    type: "vehicle",
                    suffix: " vehicles",
                    icon: "fa-truck",
                    list: ko.pureComputed(function() {
                        return params.list().filter(function(element) {
                            return element.type === "vehicle";
                        });
                    }),
                    active: ko.pureComputed(function() {
                        return ko.unwrap(params.type) === "vehicle";
                    })
                }
            ]);
        }
    };
});
