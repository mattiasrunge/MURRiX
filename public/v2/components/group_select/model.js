"use strict";

define([
    "text!./template.html",
    "knockout",
    "typeahead",
    "lib/notification",
    "lib/user",
    "lib/socket"
], function(template, ko, typeahead, notification, user, socket) {
    return {
        template: template,
        viewModel: function(params) {
            this.disable = ko.pureComputed(function() {
                return ko.unwrap(params.disable) || user.user() === false;
            });
            this.placeholder = ko.unwrap(params.placeholder);
            var value = this.value = params.value || ko.observable("");
            this.valid = ko.observable(false);
            this.focus = ko.observable(false);

            this.options = {
                items: params.limit,
                source: function(queryString, callback) {
                    var query = { name: { $regex: ".*" + queryString + ".*", $options: "-i" } };

                    if (params.types && params.types.length > 0) {
                        query.type = { $in: params.types };
                    }

                    socket.emit("findGroups", { }, function(error, groupDataList) {
                        if (error) {
                            notification.error(error);
                            callback([]);
                            return;
                        }

                        groupDataList = Object.keys(groupDataList).map(function(id) {
                            return groupDataList[id];
                        });

                        groupDataList = groupDataList.map(function(element) {
                            element.toString = function() { return this._id; };
                            return element;
                        });

                        callback(groupDataList);
                    });
                },
                updater: function(key) {
        //           if (params.id() === key) {
        //             params.id.valueHasMutated();
        //           } else {

                    params.id(key._id);
        //           }

                    return "";
                },
                sorter: function(items) {
                    return items;
                },
                displayText: function(item) {
                    return item;
                },
                matcher: function(userData) {
                    return ~userData.name.toLowerCase().indexOf(this.query.toLowerCase());
                },
                highlighter: function(userData) {
                    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
                    var name = userData.name.replace(new RegExp("(" + query + ")", "ig"), function($1, match) {
                        return "<strong>" + match + "</strong>";
                    });


                    return name;
                }
            };

            this.dispose = function() {
            };
        }
    };
});
