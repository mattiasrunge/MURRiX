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

                    socket.emit("findUsers", { }, function(error, userDataList) {
                        if (error) {
                            notification.error(error);
                            callback([]);
                            return;
                        }

                        userDataList = Object.keys(userDataList).map(function(id) {
                            return userDataList[id];
                        });

                        userDataList = userDataList.map(function(element) {
                            element.toString = function() { return this._id; };
                            return element;
                        });

                        callback(userDataList);
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


                    return name + " (" + userData.username + ")";
                }
            };

            this.dispose = function() {
            };
        }
    };
});
