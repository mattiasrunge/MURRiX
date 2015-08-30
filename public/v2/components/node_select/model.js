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
            this.bold = ko.pureComputed(function() {
                return !this.focus() && this.valid() && this.value() !== "";
            }.bind(this));

            this.options = {
                items: params.limit,
                source: function(queryString, callback) {
                    if (queryString === "") {
                        return callback([]);
                    }

                    var query = { name: { $regex: ".*" + queryString + ".*", $options: "-i" } };

                    if (params.types && params.types.length > 0) {
                        query.type = { $in: params.types };
                    }

                    socket.emit("find", { query: query, options: { collection: "nodes", limit: params.limit } }, function(error, nodeDataList) {
                        if (error) {
                            notification.error(error);
                            callback([]);
                            return;
                        }

                        nodeDataList = nodeDataList.map(function(element) {
                            element.toString = function() { return this._id; };
                            return element;
                        });

                        callback(nodeDataList);
                    });
                },
                updater: function(key) {
        //           if (params.id() === key) {
        //             params.id.valueHasMutated();
        //           } else {
console.log("updater", key._id);
                    params.id(key._id);
        //           }

                    return value();
                },
                sorter: function(items) {
                    return items;
                },
                displayText: function(item) {
                    return item;
                },
                matcher: function(nodeData) {
                    return ~nodeData.name.toLowerCase().indexOf(this.query.toLowerCase());
                },
                highlighter: function(nodeData) {
                    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
                    var name = nodeData.name.replace(new RegExp("(" + query + ")", "ig"), function($1, match) {
                        return "<strong>" + match + "</strong>";
                    });

                    var url = "http://placekitten.com/g/32/32";

                    if (nodeData._profilePicture) {
                        url = "/preview?id=" + nodeData._profilePicture + "&width=80&height=80&square=1";
                        //url = "/media/" + nodeData.profilePictureInfo.id + "/image/80/80?angle=" + nodeData.profilePictureInfo.angle + "&mirror=" + nodeData.profilePictureInfo.mirror;
                    }

                    return "<div><img style='margin-right: 20px; width: 32px; height: 32px;' class='pull-left' src='" + url + "'/><span style='padding: 6px; display: inline-block;'>" + name + "</span></div>";
                }
            };

            var setValid = function() {
                if (params.id()) {
                    var query = { _id: params.id() };

                    socket.emit("find", { query: query, options: { collection: "nodes" } }, function(error, nodeDataList) {
                        if (error) {
                            notification.error(error);
                            return
                        }

                        if (nodeDataList.length === 0) {
                            console.log("No match found");
                            return;
                        }

                        this.value(nodeDataList[0].name);
                        this.valid(true);
                    }.bind(this));
                } else {
                    this.value("");
                }
            }.bind(this);

            var s1 = this.focus.subscribe(function(value) {
                if (!value) {
                    if (this.value() === "") {
                        params.id(false);
                        return;
                    } else {
                        setValid();
                    }
                }
            }.bind(this));

            var s2 = params.id.subscribe(setValid);

            setValid();

            console.log(this, arguments);

            this.dispose = function() {
                s1.dispose();
                s2.dispose();
            };
        }
    };
});
