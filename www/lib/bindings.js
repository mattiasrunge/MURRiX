"use strict";

/* globals google */

/* TODO:
 * Cleanup of map is not done, memory leak there
 * Make map more flexible with an option to send in markers as a list
 */

const $ = require("jquery");
const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const stat = require("lib/status");
const loc = require("lib/location");
const chron = require("chron-time");
require("corejs-typeahead/dist/typeahead.jquery");

import "moment-duration-format";
import "jdomizio-imgareaselect";

ko.bindingHandlers.moveToBody = {
    init: (element) => {
        let $element = $(element);
        let $parent = $element.parent();

        $element.detach();
        $("body").append($element);

        ko.utils.domNodeDisposal.addDisposeCallback($parent.get(0), () => {
            $element.remove();
        });
    }
};

ko.bindingHandlers.modal = {
    init: (element, valueAccessor) => {
        $(element).on("hidden.bs.modal", () => {
            valueAccessor()(false);
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).off("hidden.bs.modal");
        });
    },
    update: (element, valueAccessor) => {
        let show = ko.unwrap(valueAccessor());
        console.log("modal", show);
        $(element).modal(show ? "show" : "hide");
    }
};

ko.bindingHandlers.map = {
    init: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let zoom = ko.unwrap(value.zoom) || 10;

        let options = {
            zoom: zoom,
            center: new google.maps.LatLng(57.6706907666667, 11.9375348333333),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            streetViewControl: false,
            panControl: false,
            mapTypeControl: true,
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

        element.map = new google.maps.Map(element, options);
        element.zoom = zoom;

        google.maps.event.addListener(element.map, "click", (data) => {
            value.position({ latitude: data.latLng.lat(), longitude: data.latLng.lng() });
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).off("click");
        });
    },
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let position = ko.unwrap(value.position);
        let hasPosition = !!position;
        let zoom = ko.unwrap(value.zoom) || 10;

        if (!position) {
            position = {
                latitude: 57.6706907666667,
                longitude: 11.9375348333333
            };
        }

        element.map.panTo(new google.maps.LatLng(position.latitude, position.longitude));

        if (element.marker) {
            element.marker.setMap(null);
            delete element.marker;
        }

        element.marker = new google.maps.Marker({
            position: {
                lat: position.latitude,
                lng: position.longitude
            },
            map: element.map,
            draggable: value.editable,
            visible: hasPosition
        });

        google.maps.event.addListener(element.marker, "dragend", (data) => {
            value.position({ latitude: data.latLng.lat(), longitude: data.latLng.lng() });
        });

        if (element.zoom !== zoom) {
            element.map.setZoom(zoom);
        }
    }
};

ko.bindingHandlers.tooltip = {
    init: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        /*$element.tooltip({
            html: true,
            title: value
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.tooltip("destroy");
        });*/
    },
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        //$(element).data("bs.tooltip").options.title = value;
    }
};


// http://stackoverflow.com/questions/16930869/how-to-access-file-input-with-knockout-binding
ko.bindingHandlers.fileUpload = {
    init: function (element, valueAccessor) {
        let $element = $(element);

        $element.on("change", () => {
            valueAccessor()(Array.from(element.files));
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.off("change");
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
        let replace = false;

        $element.off("click");

        if (typeof value !== "string") {
            replace = ko.unwrap(value.replace);
            delete value.replace;

            value = loc.constructUrl(value, true);
        } else if (value[0] !== "#" && !value.startsWith("http") && !value.startsWith("mailto")) {
            value = "#" + value;
        }

        if ($element.prop("tagName").toLowerCase() === "a") {
            $element.attr("href", value);

            $element.on("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                loc.goto(value, true, replace);
            });
        } else if ($element.prop("tagName").toLowerCase() === "iframe") {
            $element.attr("src", value);
            $element.get(0).contentWindow.location = value;
        } else {
            $element.on("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                loc.goto(value, true, replace);
            });
        }
    }
};

ko.bindingHandlers.duration = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        if (!value) {
            $(element).text("Unknown");
            return;
        }

        $(element).text(moment.duration(value, "seconds").format());
    }
};

ko.bindingHandlers.datetimeDayString = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        if (!value) {
            $(element).text("Unknown");
            return;
        }

        let dateItem = moment.utc(value * 1000).calendar(null, {
            sameDay: "[Today]",
            nextDay: "[Tomorrow]",
            nextWeek: "dddd",
            lastDay: "[Yesterday]",
            lastWeek: "[Last] dddd",
            sameElse: "dddd, MMMM Do YYYY"
        });

        $(element).html(dateItem);
    }
};

ko.bindingHandlers.datetimeDay = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        if (!value) {
            $(element).text("Unknown");
            return;
        }

        let dateItem = moment.utc(value * 1000);

        if (!dateItem.date()) {
            $(element).html(value);
        } else {
            $(element).html(dateItem.format("dddd, MMMM Do YYYY"));
        }
    }
};


ko.bindingHandlers.displayTimeDay = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        if (!value || !value.timestamp) {
            return $element.text("Unknown");
        }

        let time = moment.utc(value.timestamp * 1000);

        let format = "";

        if (value.accuracy === "second") {
            format = "dddd, MMMM Do YYYY";
        } else if (value.accuracy === "minute") {
            format = "dddd, MMMM Do YYYY";
        } else if (value.accuracy === "hour") {
            format = "dddd, MMMM Do YYYY";
        } else if (value.accuracy === "day") {
            format = "dddd, MMMM Do YYYY";
        } else if (value.accuracy === "month") {
            format = "MMMM YYYY";
        } else if (value.accuracy === "year") {
            format = "YYYY";
        } else {
            return console.error("Unknown accuracy type ", value);
        }

        $element.text(time.format(format));
    }
};

ko.bindingHandlers.displayTimeline = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        $element.empty();

        if (!value || !value.timestamp) {
            return $element.text("Unknown");
        }

        let time = moment(value.timestamp * 1000);

        let year = false;
        let date = false;
        let clock = false;

        if (value.quality === "utc" || value.accuracy === "second") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH:mm:ss");
        } else if (value.accuracy === "minute") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH:mm");
        } else if (value.accuracy === "hour") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH");
        } else if (value.accuracy === "day") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
        } else if (value.accuracy === "month") {
            year = time.format("YYYY");
            date = time.format("MMMM");
        } else if (value.accuracy === "year") {
            year = time.format("YYYY");
        } else {
            return console.error("Unknown accuracy type ", value);
        }

        if (year) {
            $element.append($("<div style='font-size: 26px;'>" + year + "</div>"));
        }

        if (date) {
            $element.append($("<div>" + date + "</div>"));
        }

        if (clock) {
            $element.append($("<div style='font-size: 12px; margin-top: 5px;'>" + clock + "</div>"));
        }
    }
};

ko.bindingHandlers.displayTime = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        if (!value || !value.timestamp) {
            return $element.text("Unknown");
        }

        let time = moment.utc(value.timestamp * 1000);

        let format = "";

        if (value.quality === "utc") {
            format = "dddd, MMMM Do YYYY, HH:mm:ss Z";
        } else if (value.accuracy === "second") {
            format = "dddd, MMMM Do YYYY, HH:mm:ss";
        } else if (value.accuracy === "minute") {
            format = "dddd, MMMM Do YYYY, HH:mm";
        } else if (value.accuracy === "hour") {
            format = "dddd, MMMM Do YYYY, HH";
        } else if (value.accuracy === "day") {
            format = "dddd, MMMM Do YYYY";
        } else if (value.accuracy === "month") {
            format = "MMMM YYYY";
        } else if (value.accuracy === "year") {
            format = "YYYY";
        } else {
            return console.error("Unknown accuracy type ", value);
        }

        $element.text(time.format(format));
    }
};

ko.bindingHandlers.datetime = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        if (!value) {
            $(element).text("Unknown");
            return;
        }

        let format = "dddd, MMMM Do YYYY, HH:mm:ss Z";

        if ($(element).data("format")) {
            format = $(element).data("format");
        }

        let dateItem = moment(value).local();

        if (!dateItem.date()) {
            $(element).html(value);
        } else {
            $(element).html(dateItem.format(format));
        }
    }
};

ko.bindingHandlers.datetimeUtc = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        if (!value) {
            $(element).text("Unknown");
            return;
        }

        let dateItem = moment.utc(value * 1000);

        if (!dateItem.date()) {
            $(element).html(value);
        } else {
            $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
        }
    }
};

ko.bindingHandlers.datetimeLocal = {
    update: (element, valueAccessor) => {
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
    update: (element, valueAccessor) => {
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

//http://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
ko.bindingHandlers.number = {
    update: (element, valueAccessor) => {
        let number = ko.unwrap(valueAccessor());
        let j = number % 10;
        let k = number % 100;
        let str = number + "th";

        if (j === 1 && k !== 11) {
            str = number + "st";
        } else if (j === 2 && k !== 12) {
            str = number + "nd";
        } else if (j === 3 && k !== 13) {
            str = number + "rd";
        }

        $(element).html(str);
    }
};

ko.bindingHandlers.htmlSize = {
    update: (element, valueAccessor) => {
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

ko.bindingHandlers.positionAddress = {
    update: (element, valueAccessor) => {
        let value = valueAccessor();
        let where = ko.unwrap(value) || false;

        if (!where) {
            return $(element).text("Unknown");
        }

        let longitude = where.longitude;
        let latitude = where.latitude;

        if (!longitude || !latitude) {
            return $(element).text("Unknown");
        }

        api.lookup.getAddressFromPosition(longitude, latitude)
        .then((address) => {
            if (address) {
                $(element).text(address);
            } else {
                $(element).text("Unknown");
            }
        })
        .catch((error) => {
            $(element).text("Unknown");
            stat.printError(error);
        });
    }
};

ko.bindingHandlers.nodename = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.vfs.resolve(value)
        .then((node) => {
            $element.text(node.attributes.name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            stat.printError(error);
        });
    }
};

ko.bindingHandlers.unameNice = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.auth.name(value)
        .then((name) => {
            $element.text(name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            stat.printError(error);
        });
    }
};

ko.bindingHandlers.uname = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.auth.uname(value)
        .then((name) => {
            $element.text(name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            stat.printError(error);
        });
    }
};

ko.bindingHandlers.gname = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.auth.gname(value)
        .then((name) => {
            $element.text(name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            stat.printError(error);
        });
    }
};

ko.bindingHandlers.gnameNice = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.auth.gnameNice(value)
        .then((name) => {
            $element.text(name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            stat.printError(error);
        });
    }
};

ko.bindingHandlers.timeInput = {
    init: (element, valueAccessor) => {
        let $element = $(element);
        let $parent = $element.parent();

        $element.attr("maxlength", 25);
        $element.attr("placeholder", "YYYY-MM-DD HH:mm:ssZ");

        let $error = $("<span class='text-danger'></span>");
        $error.hide();
        $parent.append($error);

        $element.on("keyup", () => {
            try {
                chron.str2time($element.val());
                $element.parent().removeClass("has-error");
                $error.hide();
            } catch (e) {
                $error.text(e.message);
                $error.show();
                $element.parent().addClass("has-error");
            }
        });

        $element.on("blur", () => {
            $error.hide();
        });

        $element.on("change", () => {
            try {
                valueAccessor()(chron.str2time($element.val()));
            } catch (e) {
            }
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.off("blur");
            $element.off("change");
            $error.remove();
        });
    },
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        $element.val(chron.time2str(value || {}));
    }
};


ko.bindingHandlers.groupselect = {
    lookup: async (querystr, limit) => {
        let list = await api.auth.groups({
            filter: {
                "attributes.name": { $regex: ".*" + querystr + ".*", $options: "-i" }
            },
            limit: limit
        });

        return list.map((item) => {
            return {
                path: item.path,
                node: item.node
            };
        });
    },
    init: (element, valueAccessor) => {
        let gid = valueAccessor().gid;
        let limit = ko.unwrap(valueAccessor().limit) || 10;
        let $element = $(element);
        element.loading = stat.create();

        $element.addClass("typeahead");

        $element.typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            display: (selection) => selection.node.attributes.name,
            source: (querystr, dummy, resolve) => {
                ko.bindingHandlers.groupselect.lookup(querystr, limit)
                .then(resolve)
                .catch((error) => {
                    stat.printError(error);
                    resolve([]);
                });
            },
            templates: {
                suggestion: (selection) => {
                    return $("<div>" + selection.node.attributes.name + "</div>");
                }
            },
            limit: limit
        });

        $element.on("typeahead:asyncrequest", () => element.loading(true));
        $element.on("typeahead:asynccancel", () => element.loading(false));
        $element.on("typeahead:asyncreceive", () => element.loading(false));
        $element.on("typeahead:active", () => {
            $element.removeClass("valid");
        });
        $element.on("typeahead:idle", () => {
            if (gid()) {
                $element.addClass("valid");
            }
        });
        $element.on("typeahead:change typeahead:select", () => {
            // TODO: event, selection is in parameters, nno need for a lookup!
            ko.bindingHandlers.groupselect.lookup($element.typeahead("val"), limit)
            .then((list) => {
                if (list.length === 1) {
                    gid(list[0].node.attributes.gid);
                    $element.addClass("valid");
                } else {
                    gid(false);
                    $element.removeClass("valid");
                }
            })
            .catch((error) => {
                stat.printError(error);
                gid(false);
            });
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.typeahead("destroy");
            stat.destroy(element.loading);
        });
    },
    update: (element, valueAccessor) => {
        let gid = valueAccessor().gid;
        let $element = $(element);

        if (gid()) {
            element.loading(true);
            api.auth.groups({ filter: { "attributes.gid": gid() }, limit: 1 })
            .then((nodes) => {
                return nodes[0] ? nodes[0].node : false;
            })
            .then((node) => {
                element.loading(false);

                if (node) {
                    $element.addClass("valid");
                    $element.typeahead("val", node.attributes.name);
                } else {
                    gid(false);
                    $element.removeClass("valid");
                    $element.typeahead("val", "");
                }
            })
            .catch(() => {
                element.loading(false);
                gid(false);
            });
        } else {
            $element.removeClass("valid");
            $element.typeahead("val", "");
        }
    }
};

ko.bindingHandlers.nodeselect = {
    lookup: async (root, querystr, limit) => {
        let filter = limit === 1 ? querystr : { $regex: ".*" + querystr + ".*", $options: "-i" };

        let list = await api.vfs.list(root, {
            filter: {
                "attributes.name": filter
            },
            limit: limit
        });

        return list.map((item) => {
            return {
                path: item.path,
                node: item.node,
                filename: item.filename
            };
        });
    },
    init: (element, valueAccessor) => {
        let root = ko.unwrap(valueAccessor().root);
        let path = valueAccessor().path;
        let limit = ko.unwrap(valueAccessor().limit) || 10;
        let $element = $(element);
        element.loading = stat.create();

        $element.addClass("typeahead");




        $element.typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            display: (selection) => selection.node.attributes.name,
            source: (querystr, dummy, resolve) => {
                ko.bindingHandlers.nodeselect.lookup(root, querystr, limit)
                .then(resolve)
                .catch((error) => {
                    stat.printError(error);
                    resolve([]);
                });
            },
            templates: {
                suggestion: (selection) => {
                    let $d = $("<div>" + selection.node.attributes.name + "</div>");

                    api.vfs.resolve(selection.path + "/profilePicture", { noerror: true })
                    .then((node) => {
                        if (node) {
                            return api.file.getMediaUrl(node._id, {
                                width: 16,
                                height: 16,
                                type: "image"
                            });
                        }

                        return false;
                    })
                    .then((filename) => {
                        if (filename) {
                            let $i = $("<img src='" + filename + "' style='width: 16px; height: 16px;'>");

                            $d.prepend($i);
                        }
                    })
                    .catch((error) => {
                        stat.printError(error);
                    });

                    return $d;
                }
            },
            limit: limit
        });

        $element.on("typeahead:asyncrequest", () => element.loading(true));
        $element.on("typeahead:asynccancel", () => element.loading(false));
        $element.on("typeahead:asyncreceive", () => element.loading(false));
        $element.on("typeahead:active", () => {
            $element.removeClass("valid");
        });
        $element.on("typeahead:idle", () => {
            if (path()) {
                if ($element.typeahead("val") === "") {
                    path("");
                } else if (path.valueHasMutated) {
                    path.valueHasMutated();
                }
            }
        });

        let select = () => {
            // TODO: event, selection is in parameters, nno need for a lookup!
            ko.bindingHandlers.nodeselect.lookup(root, $element.typeahead("val"), 1)
            .then((list) => {
                if (list.length === 1) {
                    path(list[0].path);
                    $element.addClass("valid");
                } else {
                    path(false);
                    $element.removeClass("valid");
                }
            })
            .catch((error) => {
                stat.printError(error);
                path(false);
            });
        };

        $element.on("typeahead:change", () => { select(); });
        $element.on("typeahead:select", () => { select(); });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.typeahead("destroy");
            stat.destroy(element.loading);
        });
    },
    update: (element, valueAccessor) => {
        let path = valueAccessor().path;
        let errorObservable = valueAccessor().error;
        let initial = ko.unwrap(valueAccessor().initial) || "";
        let $element = $(element);

        if (path()) {
            element.loading(true);
            api.vfs.resolve(path())
            .then((node) => {
                element.loading(false);

                if (node) {
                    $element.addClass("valid");
                    $element.typeahead("val", node.attributes.name);
                } else {
                    path(false);
                    $element.removeClass("valid");
                    $element.typeahead("val", "");
                }
            })
            .catch((error) => {
                element.loading(false);
                $element.removeClass("valid");

                if (errorObservable) {
                    errorObservable(error);
                }

                path(false);
            });
        } else {
            $element.removeClass("valid");
            $element.typeahead("val", initial);
        }
    }
};

// TODO: Clean this mess upp
ko.bindingHandlers.picture = {
    update: (element, valueAccessor) => {
        let data = ko.unwrap(valueAccessor());
        let item = ko.unwrap(data.item);
        let selectTag = ko.unwrap(data.selectTag);
        let filename = ko.unwrap(data.filename) || (item ? item.filename : false);
        let tags = ko.unwrap(data.tags);
        let width = ko.unwrap(data.width);
        let height = ko.unwrap(data.height);
        let classes = ko.unwrap(data.classes) || "";
        let title = ko.unwrap(data.title);
        let type = ko.unwrap(data.type);
        let $element = $(element);
        let $span = $element;

        if (element.$img) {
            element.$img.imgAreaSelect({ "remove": true });
        }

        $element.empty();

        $element.addClass("grid-picture-container");

        if (!filename) {
            let css = [];

            if (width) {
                css.push("width: " + width + "px");
            }

            if (height) {
                css.push("height: " + height + "px");
            }

            $span = $("<div style='position: relative; " + css.join(";") + "; background-color: black;' class='" + classes + "'></div>");

            $element.append($span);
        } else {
            let css = [];

            if (width) {
                css.push("width: " + width + "px");
            }

            if (height) {
                css.push("height: " + height + "px");
            }

            let containerCss = css.join(";");

            if (classes.includes("img-responsive")) { // TODO: Hack!
                containerCss = "";
            }

            css = [];

            $span = $("<span style='display: inline-block; position: relative; " + containerCss + "' class='" + classes + "'></span>");
            let $img;

            $img = $("<img src='" + filename + "' style='" + css.join(";") + "' class='" + classes + "'>");

            $span.append($img);

            $element.append($span);

            if (tags) {
                for (let tag of tags) {
                    let $frame = $("<div class='tag-frame'></div>");
                    let $label = $("<div class='tag-label'></div>");
                    let $text = $("<span class='tag-label-text'>" + tag.node().attributes.name + "</span>");

                    let top = (tag.link.attributes.y - (tag.link.attributes.height / 2)) * 100;
                    let left = (tag.link.attributes.x - (tag.link.attributes.width / 2)) * 100;
                    let height = tag.link.attributes.height * 100;
                    let width = tag.link.attributes.width * 100;


                    if (!isNaN(top) && !isNaN(left) && !isNaN(height) && !isNaN(width)) {
                        $frame.css("top", top + "%");
                        $frame.css("left", left + "%");
                        $frame.css("height", height + "%");
                        $frame.css("width", width + "%");

                        $label.append($text);
                        $frame.append($label);
                        $span.append($frame);
                    }
                }
            }

            if (selectTag) {
                let imgWidth = $img.width();
                let imgHeight = $img.height();

                let onSelectEnd = (img, selection) => {
                    if (selection.width === 0 || selection.height === 0) {
                        return data.selectTag(false);
                    }

                    let result = {};
                    let x = selection.x1 + (selection.width / 2);
                    let y = selection.y1 + (selection.height / 2);

                    result.x = x / imgWidth;
                    result.y = y / imgHeight;

                    result.width = selection.width / imgWidth;
                    result.height = selection.height / imgHeight;

                    data.selectTag(result);
                };

                let options = {
                    minWidth: 32,
                    minHeight: 32,
                    instance: true,
                    movable: true,
                    resizable: true,
                    handles: true,
                    keys: false,
                    onSelectEnd: onSelectEnd
                };

                if (isNaN(selectTag.y) || isNaN(selectTag.x) || isNaN(selectTag.height) || isNaN(selectTag.width)) {
                    $img.imgAreaSelect(options);
                } else {
                    options.show = true;

                    options.x1 = imgWidth * (selectTag.x - selectTag.width / 2);
                    options.x2 = imgWidth * (selectTag.x + selectTag.width / 2);

                    options.y1 = imgHeight * (selectTag.y - selectTag.height / 2);
                    options.y2 = imgHeight * (selectTag.y + selectTag.height / 2);

                    $img.imgAreaSelect(options);
                }
            }

            element.$img = $img;
        }

        $element = $span;

        if (type === "image") {
            $element.append($("<i class='material-icons grid-picture-type' title='Image file'>camera_alt</i>"));
        } else if (type === "video") {
            $element.append($("<i class='material-icons grid-picture-type' title='Video file'>videocam</i>"));
        } else if (type === "audio") {
            $element.append($("<i class='material-icons grid-picture-type' title='Audio file'>mic</i>"));
        } else if (type === "document") {
            $element.append($("<i class='material-icons grid-picture-type' title='Document file'>description</i>"));
        } else if (type) {
            $element.append($("<i class='material-icons grid-picture-type' title='Unknown file'>attachment</i>"));
        }

        if (title) {
            var $title = $("<span class='grid-picture-title'>" + title + "</span>");

            if (type) {
                $title.css("padding-right", "40px");
            }

            $element.append($title);
        }
    }
};
