"use strict";

/* TODO:
 * Cleanup of map is not done, memory leak there
 * Make map more flexible with an option to send in markers as a list
 */

const $ = require("jquery");
const ko = require("knockout");
const co = require("co");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const loc = require("lib/location");
const typeahead = require("typeahead");
const autosize = require("autosize");
const LazyLoad = require("lazyload");

let lazyload = new LazyLoad({
    show_while_loading: true,
    elements_selector: "img.lazyload"
});

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

        element.map = new google.maps.Map(element, options);

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).off("click");
        });
    },
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let position = ko.unwrap(value.position);
        let zoom = ko.unwrap(value.zoom) || 10;

        if (position) {
            element.map.setCenter(new google.maps.LatLng(position.latitude, position.longitude));

            if (element.marker) {
                element.marker.setMap(null);
                delete element.marker;
            }

            element.marker = new google.maps.Marker({
                position: {
                    lat: position.latitude,
                    lng: position.longitude
                },
                map: element.map
            });
        } else {
            if (element.marker) {
                element.marker.setMap(null);
                delete element.marker;
            }

            element.map.setCenter(new google.maps.LatLng(57.6706907666667, 11.9375348333333));
        }

        element.map.setZoom(zoom);
    }
};

ko.bindingHandlers.autosize = {
    init: (element) => {
        autosize(element);

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            autosize.destroy(element);
        });
    },
    update: (element, valueAccessor) => {
        valueAccessor()();
        autosize.update(element);
    }
};

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

            $element.on("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
                loc.goto(value);
            });
        } else if ($element.prop("tagName").toLowerCase() === "iframe") {
            $element.attr("src", value);
            $element.get(0).contentWindow.location = value;
        } else {
            $element.on("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
                loc.goto(value);
            });
        }
    }
};


ko.bindingHandlers.datetimeDay = {
    update: function(element, valueAccessor) {
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

ko.bindingHandlers.datetimeUtc = {
    update: function(element, valueAccessor) {
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

ko.bindingHandlers.nodename = {
    update: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.vfs.resolve(value)
        .then((node) => {
            $element.text(node.attributes.name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            status.printError(error);
        });
    }
};

ko.bindingHandlers.unameNice = {
    update: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.auth.name(value)
        .then((name) => {
            $element.text(name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            status.printError(error);
        });
    }
};

ko.bindingHandlers.uname = {
    update: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.auth.uname(value)
        .then((name) => {
            $element.text(name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            status.printError(error);
        });
    }
};

ko.bindingHandlers.gname = {
    update: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        api.auth.gname(value)
        .then((name) => {
            $element.text(name);
        })
        .catch((error) => {
            $element.html("<span class='text-error'>unknown</span>");
            status.printError(error);
        });
    }
};

ko.bindingHandlers.mode = {
    update: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        $element.text(utils.modeString(value));
    }
};

ko.bindingHandlers.nodeselect = {
    lookup: co.wrap(function*(root, querystr) {
        let list = yield api.vfs.list(root, false, {
            "attributes.name": { $regex: ".*" + querystr + ".*", $options: "-i" }
        });

        return list.map((item) => {
            return {
                path: item.path,
                node: item.node
            };
        });
    }),
    init: (element, valueAccessor) => {
        let root = ko.unwrap(valueAccessor().root);
        let path = valueAccessor().path;
        let limit = ko.unwrap(valueAccessor().limit) || 10;
        let $element = $(element);
        element.loading = status.create();

        $element.addClass("typeahead");

        $element.typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            display: (selection) => selection.node.attributes.name,
            source: (querystr, dummy, resolve) => {
                ko.bindingHandlers.nodeselect.lookup(root, querystr)
                .then(resolve)
                .catch((error) => {
                    status.printError(error);
                    resolve([]);
                });
            },
            templates: {
                suggestion: (selection) => {
                    return "<div><img src='http://lorempixel.com/16/16'>" + selection.node.attributes.name + "</div>";
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
                $element.addClass("valid");
            }
        });
        $element.on("typeahead:change typeahead:select", () => {
	// TODO: event, selection is in parameters, nno need for a lookup!
            ko.bindingHandlers.nodeselect.lookup(root, $element.typeahead("val"))
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
                status.printError(error);
                path(false);
            });
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.typeahead("destroy");
            status.destroy(element.loading);
        });
    },
    update: (element, valueAccessor) => {
        let path = valueAccessor().path;
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
                path(false);
            });
        } else {
            $element.removeClass("valid");
            $element.typeahead("val", "");
        }
    }
};

ko.bindingHandlers.picture = {
    update: (element, valueAccessor) => {
        let data = ko.unwrap(valueAccessor());
        let item = ko.unwrap(data.item);
        let width = ko.unwrap(data.width);
        let height = ko.unwrap(data.height);
        let classes = ko.unwrap(data.classes) || "";
        let type = ko.unwrap(data.type);
        let $element = $(element);
        let nolazyload = !!ko.unwrap(data.nolazyload);

        $element.empty();

        $element.addClass("grid-picture-container");

        if (item) {
            let css = [];

            if (width) {
                css.push("width: " + width + "px");
            }

            if (height) {
                css.push("height: " + height + "px");
            }

            if (nolazyload) {
                $element.append($("<img src='" + item.filename + "' style='" + css.join(";") + "' class='" + classes + "'>"));
            } else {
                $element.append($("<img data-original='" + item.filename + "' style='" + css.join(";") + "' class='lazyload " + classes + "'>"));
                lazyload.update();
            }

            if (type === "image") {
                $element.append($("<i class='material-icons grid-picture-type' title='Image file'>camera_alt</i>"));
            } else if (type === "video") {
                $element.append($("<i class='material-icons grid-picture-type' title='Video file'>videocam</i>"));
            } else if (type === "audio") {
                $element.append($("<i class='material-icons grid-picture-type' title='Audio file'>mic</i>"));
            } else if (type) {
                $element.append($("<i class='material-icons grid-picture-type' title='Unknown file'>attachment</i>"));
            }

        }
    }
};

ko.bindingHandlers.pictures = {
    update: (element, valueAccessor) => {
        let data = ko.unwrap(valueAccessor());
        let items = ko.unwrap(data.items);
        let width = ko.unwrap(data.width);
        let height = ko.unwrap(data.height);
        let margin = ko.unwrap(data.margin) || 0;
        let classes = ko.unwrap(data.classes) || "";
        let $element = $(element);

        $element.empty();

        for (let item of items) {
            let $image = $("<img data-original='" + item.filename + "' style='width: " + width + "px; height: " + height + "px; background-color: black; margin-right: " + margin + "px; margin-bottom: " + margin + "px;' class='lazyload " + classes + "'>");
            $element.append($image);
        }

        lazyload.update();
    }
};
