"use strict";

/* globals google */

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
const stat = require("lib/status");
const loc = require("lib/location");
const Slider = require("slider");
const autosize = require("autosize");
const LazyLoad = require("lazyload");
const typeahead = require("typeahead"); // jshint ignore:line
const imgareaselect = require("jquery.imgareaselect"); // jshint ignore:line

let lazyload = new LazyLoad({
    show_while_loading: true, // jshint ignore:line
    elements_selector: "img.lazyload" // jshint ignore:line
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

            //             $element.on("click", (event) => {
            //                 event.preventDefault();
            //                 event.stopPropagation();
            //                 loc.goto(value);
            //             });
        } else if ($element.prop("tagName").toLowerCase() === "iframe") {
            $element.attr("src", value);
            $element.get(0).contentWindow.location = value;
        } else {
            $element.on("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                loc.goto(value);
            });
        }
    }
};

ko.bindingHandlers.yearSlider = {
    init: (element, valueAccessor) => {
        let options = valueAccessor();

        let slider = new Slider(element, {
            value: ko.unwrap(options.year),
            min: options.min ? options.min : 1600,
            max: options.max ? options.max : new Date().getFullYear(),
            step: 1,
            selection: "none"
        });

        slider.on("slideStop", () => { options.year(slider.getValue()); });

        let subscription = options.year.subscribe((value) => {
            slider.setValue(value);
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            subscription.dispose();
            slider.off("slideStop");
            slider.destroy();
        });
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

ko.bindingHandlers.datetime = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());

        if (!value) {
            $(element).text("Unknown");
            return;
        }

        let dateItem = moment(value).local();

        if (!dateItem.date()) {
            $(element).html(value);
        } else {
            $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
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

http://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
ko.bindingHandlers.number = {
    update: (element, valueAccessor) => {
        let number = ko.unwrap(valueAccessor());
        let j = number % 10;
        let k = number % 100;
        let str = number + "th";

        if (j == 1 && k != 11) {
            str = number + "st";
        } else if (j == 2 && k != 12) {
            str = number + "nd";
        } else if (j == 3 && k != 13) {
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

ko.bindingHandlers.mode = {
    update: (element, valueAccessor) => {
        let value = ko.unwrap(valueAccessor());
        let $element = $(element);

        $element.text(utils.modeString(value));
    }
};


ko.bindingHandlers.groupselect = {
    lookup: co.wrap(function*(querystr, limit) {
        let list = yield api.auth.groups({
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
    }),
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
    lookup: co.wrap(function*(root, querystr, limit) {
        console.log("lookup", limit, querystr);
        let filter = limit === 1 ? querystr : { $regex: ".*" + querystr + ".*", $options: "-i" };

        let list = yield api.vfs.list(root, {
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
    }),
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
                    console.log(selection);

                    let $d = $("<div>" + selection.node.attributes.name + "</div>");

                    api.vfs.resolve(selection.path + "/profilePicture", { noerror: true })
                    .then((node) => {
                        if (node) {
                            return api.file.getPictureFilenames([ node._id ], 16, 16);
                        }

                        return false;
                    })
                    .then((filenames) => {
                        if (filenames && filenames.length > 0) {
                            let $i = $("<img src='" + filenames[0].filename + "' style='width: 16px; height: 16px;'>");

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
            console.log("valid");
            $element.removeClass("valid");
        });
        $element.on("typeahead:idle", () => {
            console.log("idle");
            if (path()) {
                $element.addClass("valid");
            } else {
                path.valueHasMutated();
            }
        });
        $element.on("typeahead:change typeahead:select", () => {
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
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $element.typeahead("destroy");
            stat.destroy(element.loading);
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
            .catch(() => {
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
        let filename = ko.unwrap(data.filename) || item.filename;
        let tags = ko.unwrap(data.tags);
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

            let containerCss = css.join(";");

            if (classes.indexOf("img-responsive") !== -1) { // TODO: Hack!
                containerCss = "";
            }

            let $span = $("<span style='display: inline-block; position: relative; " + containerCss + "' class='" + classes + "'></span>");
            let $img;

            if (nolazyload) {
                $img = $("<img src='" + filename + "' style='" + css.join(";") + "' class='" + classes + "'>");
            } else {
                $img = $("<img data-original='" + filename + "' style='" + css.join(";") + "' class='lazyload " + classes + "'>");
            }

            $span.append($img);

            $element.append($span);

            if (tags) {
                for (let tag of tags) {
                    let $frame = $("<div class='tag-frame'></div>");
                    let $label = $("<div class='tag-label'></div>");
                    let $text = $("<span class='tag-label-text'>" + tag.node.attributes.name + "</span>");

                    let top = (tag.link.attributes.y - (tag.link.attributes.height / 2)) * 100;
                    let left = (tag.link.attributes.x - (tag.link.attributes.width / 2)) * 100;
                    let height = tag.link.attributes.height * 100;
                    let width = tag.link.attributes.width * 100;

                    $frame.css("top", top + "%");
                    $frame.css("left", left + "%");
                    $frame.css("height", height + "%");
                    $frame.css("width", width + "%");

                    $label.append($text);
                    $frame.append($label);
                    $span.append($frame);

//                     $span.imgAreaSelect({ x1: top, y1: left, x2: left + width, y2: top + height, handles: true });
                }
            }

            lazyload.update();
            $element = $span;

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
