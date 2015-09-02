"use strict";

define([
    "knockout",
    "jquery",
    "slider",
    "moment",
    "autosize",
    "lib/socket",
    "lib/tools",
    "lib/location"
], function(ko, $, slider, moment, autosize, socket, tools, location) {
    var activeImages = [];
    var queuedImages = [];

    function loadImages(imageDone) {
        if (imageDone) {
            activeImages.splice(activeImages.indexOf(imageDone), 1);
        }

        while (queuedImages.length > 0 && activeImages.length < 5) {
            var toActivate = queuedImages.splice(0, Math.max(5 - activeImages.length, 0));

            for (var n = 0; n < toActivate.length; n++) {
                toActivate[n].src = toActivate[n]._src;
                delete toActivate[n]._src;
            }

            activeImages = activeImages.concat(toActivate);
        }
    }

    ko.bindingHandlers.map = {
        init: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            var $element = $(element);

            element.element = $("<div style='height: 100%;'></div>");
            $element.append(element.element);

            var options = {
                zoom: 10,
                center: new google.maps.LatLng(57.6706907666667, 11.9375348333333),
//                 mapTypeId: google.maps.MapTypeId.HYBRID,
                streetViewControl: false,
                panControl: false,
                mapTypeControl: false,
                zoomControl: true,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.DEFAULT,
                    position: google.maps.ControlPosition.RIGHT_TOP
                },
                scaleControl: true,
                scaleControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                }
            };

            element.map = new google.maps.Map(element.element.get(0), options);

            if (value.resize) {
                var resize = function() {
                    var bottom = parseInt($element.css("bottom").replace("px", ""), 10);
                    $element.css("height", ($(window).innerHeight() - $element.offset().top - bottom) + "px");
                    google.maps.event.trigger(element.map, "resize");
                }

                $(window).on("resize", resize);
                resize();
            } else {
                google.maps.event.trigger(element.map, "resize");
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if (value.resize) {
                    $(window).off("resize", resize);
                }

                $element.empty();
                delete element.map;
            });
        }
    };

    ko.bindingHandlers.textUserAttribute = {
        update: function(element, valueAccessor) {
            var value = valueAccessor();
            var params = ko.unwrap(value).map(ko.unwrap);
            var id = params[0] || false;

            if (!id) {
                $(element).text("Unknown");
                return;
            }

            socket.emit("findUsers", { query: { _id: id }, options: { limit: 1 } }, function(error, userDataList) {
                if (error) {
                    $(element).text("Unknown");
                    notification.error(error);
                    return;
                }

                if (userDataList[id]) {
                    $(element).text(userDataList[id][params[1]]);
                } else {
                    $(element).text("Unknown");
                }
            });
        }
    };

    ko.bindingHandlers.media = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            var $element = $(element);
            var image = new Image();
            var speed = "fast";
            var fadeSwitch = false;

            if (typeof value === "object") {
                speed = value.speed ? ko.unwrap(value.speed) : speed;
                fadeSwitch = value.fadeSwitch ? ko.unwrap(value.fadeSwitch) : fadeSwitch;

                value = ko.unwrap(value.url);
            }

            if (!value) {
                console.log("Will not load empty image");
                return;
            }

            var timestamp = new Date().getTime().toString();

            if (!fadeSwitch) {
                $element.html("<i class='fa fa-spinner' style='display: block; width: 12px; margin-top: 45%; margin-left: auto; margin-right: auto;'></i>");
            }

            $element.data("loadTimestamp", timestamp);

            image.onerror = function() {
                if ($element.data("loadTimestamp") === timestamp) {
                    $element.html("<div class='text-danger' style='margin-top: 45%; text-align: center;'>Failed to load image!</div>");
                }

                loadImages(image);
            };

            image.onload = function() {
                if ($element.data("loadTimestamp") === timestamp) {
                    var $div = $("<div></div>");

                    $div.css("background-repeat", "no-repeat");
                    $div.css("background-position", "center");
                    $div.css("background-size", "contain");
                    $div.css("background-image", "url('" + value + "')");
                    $div.css("position", "absolute");
                    $div.css("top", "0");
                    $div.css("left", "0");
                    $div.css("bottom", "0");
                    $div.css("right", "0");

                    if (fadeSwitch) {
                        $div.hide();

                        var child = $element.children();

                        if (child.length > 0) {
                            child.fadeOut(speed, function() {
                                child.remove();
                            });
                        }

                        $element.append($div);
                        $div.fadeIn(speed);
                    } else {
                        $element.empty();
                        $element.append($image);
                    }
                }

                loadImages(image);
            };

            image._src = value;

            queuedImages.push(image);

            loadImages();
        }
    };

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

    ko.bindingHandlers.datetimeLocal = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());

            if (!value) {
                $(element).text("Unknown");
                return;
            }

            var dateItem = moment.utc(value * 1000).local();

            if (!dateItem.date()) {
                $(element).html(value);
            } else {
                $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
            }
        }
    };

    ko.bindingHandlers.htmlSize = {
        update: function(element, valueAccessor) {
            var fileSizeInBytes = ko.utils.unwrapObservable(valueAccessor());
            var i = -1;
            var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];

            do {
                fileSizeInBytes = fileSizeInBytes / 1024;
                i++;
            } while (fileSizeInBytes > 1024);

            $(element).html(fileSizeInBytes.toFixed(1) + byteUnits[i]);
        }
    };

    ko.bindingHandlers.yearmonth = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());

            if (!value) {
                $(element).text("Unknown");
                return;
            }

            var dateItem = moment.utc(value).local();

            if (!dateItem.date()) {
                $(element).html(value);
            } else {
                $(element).html(dateItem.format("MMMM YYYY"));
            }
        }
    };

    ko.bindingHandlers.monthday = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());

            if (!value) {
                $(element).text("Unknown");
                return;
            }

            var dateItem = moment.utc(value).local();

            if (!dateItem.date()) {
                $(element).html(value);
            } else {
                $(element).html(dateItem.format("dddd, MMMM Do"));
            }
        }
    };

    ko.bindingHandlers.nodeName = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());

            socket.emit("find", { query: { _id: value }, options: { collection: "nodes", limit: 1 } }, function(error, result) {
                if (error) {
                    $(element).text("Unknown");
                    console.log(error);
                    return;
                }

                if (result.length === 0) {
                    $(element).text("Unknown");
                    return;
                }

                $(element).text(result[0].name);
            });
        }
    };

    ko.bindingHandlers.whereName = {
        update: function(element, valueAccessor) {
            var value = valueAccessor();
            var param = ko.unwrap(value);

            var where = param || false;

            if (!where || where === null) {
                $(element).text("Unknwon");
                return;
            }

            var whereId = where._id;
            var longitude = where.longitude;
            var latitude = where.latitude;

            if (whereId) {
                ko.bindingHandlers.nodeName.update(element, ko.observable(whereId));
            } else if (longitude && latitude) {
                // TODO: Look in our own database first
                var options = {};

                options.sensor = false;
                options.latlng = latitude + "," + longitude;

                jQuery.getJSON("http://maps.googleapis.com/maps/api/geocode/json", options, function(data) {
                    if (data.status !== "OK" || data.results.length === 0) {
                        $(element).text("unknown location");
                        return;
                    }

                    $(element).text(data.results[0].formatted_address);
                });
            } else {
                $(element).text("Unknown");
            }
        }
    };

    ko.bindingHandlers.picture = {
        init: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            element.child = $("<img style='width: 100%; height: 100%;'>");
            $(element).append(element.child);
        },
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());

            element.child.attr("src", "http://placekitten.com/g/" + ko.unwrap(value.width) + "/" + ko.unwrap(value.height));

            if (ko.unwrap(value.id)) {
                element.child.attr("src", "/preview?id=" + ko.unwrap(value.id) + "&width=" + ko.unwrap(value.width) + "&height=" + ko.unwrap(value.height) + "&square=" + ko.unwrap(value.square));
            } else if (ko.unwrap(value.resolve)) {
                socket.emit("helper_resolve", ko.unwrap(value.resolve), function(error, id) {
                    if (error) {
                        return console.error(error);
                    }
                    element.child.attr("src", "/preview?id=" + id + "&width=" + ko.unwrap(value.width) + "&height=" + ko.unwrap(value.height) + "&square=" + ko.unwrap(value.square));
                });
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
                });
            } else if (ko.unwrap(value.userId)) {
                socket.emit("findUsers", { query: { _id: ko.unwrap(value.userId) }, options: { limit: 1 } }, function(error, userDataList) {
                    if (error) {
                        notification.error(error);
                        return;
                    }

                    if (userDataList[ko.unwrap(value.userId)]) {
                        socket.emit("find", { query: { _id: userDataList[ko.unwrap(value.userId)]._person }, options: { collection: "nodes", limit: 1 } }, function(error, nodeDataList) {
                            if (error) {
                                notification.error(error);
                                return
                            }

                            if (nodeDataList.length === 0 || !nodeDataList[0]._profilePicture) {
                                return;
                            }

                            element.child.attr("src", "/preview?id=" + nodeDataList[0]._profilePicture + "&width=" + ko.unwrap(value.width) + "&height=" + ko.unwrap(value.height) + "&square=" + ko.unwrap(value.square));
                        });
                    }
                });
            }
        }
    };

    ko.bindingHandlers.nodeLink = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            socket.emit("helper_resolve", value, function(error, value) {
                if (error) {
                    console.error(error);
                    return $(element).text("");
                }

                $(element).html(value.name);
                $(element).attr("href", location.constructUrl({ page: "node", nodeId: value._id }));
            });
        }
    };

    ko.bindingHandlers.resolve = {
        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            socket.emit("helper_resolve", value, function(error, value) {
                if (error) {
                    console.error(error);
                    return $(element).text("");
                }

                $(element).html(value);
            });
        }
    };

    ko.bindingHandlers.autosize = {
        init: function(element, valueAccessor) {
            autosize(element);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                autosize.destroy(element);
            });
        }
    };
});
